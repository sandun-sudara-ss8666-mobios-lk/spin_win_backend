import * as bcrypt from 'bcrypt';
import { seedProductionProducts } from '../../prisma/seed-production';

const originalEnv = { ...process.env };
beforeEach(() => {
  process.env.INITIAL_ADMIN_EMAIL = 'admin@example.com';
  process.env.INITIAL_ADMIN_PASSWORD = 'TestPassword@2026';
  process.env.INITIAL_ADMIN_NAME = 'Production Admin';
  for (const key of ['SEED_EXHIBITION_NAME', 'SEED_EXHIBITION_DESCRIPTION', 'DEFAULT_TIMEZONE', 'DEFAULT_PACING_START_TIME', 'DEFAULT_PACING_END_TIME']) delete process.env[key];
});
afterEach(() => { process.env = { ...originalEnv }; });

function database() {
  const users: any[] = [];
  const exhibitions: any[] = [];
  const days: any[] = [];
  const merchants: any[] = [];
  const rewards: any[] = [];
  const ledger: any[] = [];
  const allocations: any[] = [];
  const wheelConfigs: any[] = [];
  const tx = {
    user: { upsert: jest.fn(async ({ create, update }: any) => {
      let user = users.find(u => u.email === create.email);
      if (user) Object.assign(user, update);
      else { user = { ...create, id: 'admin' }; users.push(user); }
      return user;
    }) },
    exhibition: {
      findFirst: jest.fn(async ({ where }: any) => {
        const exhibition = exhibitions.find(e => e.name === where.name);
        return exhibition ? { ...exhibition, days: days.filter(d => d.exhibitionId === exhibition.id) } : null;
      }),
      create: jest.fn(async ({ data }: any) => { const exhibition = { ...data, id: 'expo' }; exhibitions.push(exhibition); return exhibition; }),
    },
    exhibitionDay: { upsert: jest.fn(async ({ create, update }: any) => {
      let day = days.find(d => d.exhibitionId === create.exhibitionId && d.dayNumber === create.dayNumber);
      if (day) Object.assign(day, update);
      else { day = { ...create, id: `day${create.dayNumber}` }; days.push(day); }
      return day;
    }) },
    merchant: { upsert: jest.fn(async ({ create }: any) => {
      let merchant = merchants.find(m => m.slug === create.slug);
      if (!merchant) { merchant = { ...create, id: create.slug }; merchants.push(merchant); }
      return merchant;
    }) },
    reward: {
      findFirst: jest.fn(async ({ where }: any) => rewards.find(r => r.name === where.name && (where.merchantId === undefined || r.merchantId === where.merchantId))),
      findMany: jest.fn(async (args?: any) => args?.where?.merchantId ? rewards.filter(r => r.merchantId === args.where.merchantId) : [...rewards]),
      create: jest.fn(async ({ data }: any) => { const reward = { ...data, id: `reward-${rewards.length}` }; rewards.push(reward); return reward; }),
      update: jest.fn(async ({ where, data }: any) => {
        const reward = rewards.find(r => r.id === where.id);
        if (reward) Object.assign(reward, data);
        return reward;
      }),
    },
    stockLedgerEntry: { create: jest.fn(async ({ data }: any) => ledger.push(data)) },
    dailyAllocation: { createMany: jest.fn(async ({ data }: any) => allocations.push(...data)) },
    wheelConfig: {
      findFirst: jest.fn(async ({ where }: any) => wheelConfigs.find(w => w.isPublished === where?.isPublished)),
      create: jest.fn(async ({ data }: any) => { const wc = { ...data, id: `wheel-${wheelConfigs.length}` }; wheelConfigs.push(wc); return wc; }),
    },
  };
  return { users, exhibitions, days, merchants, rewards, ledger, allocations, wheelConfigs, tx, client: { $transaction: async (fn: any) => fn(tx) } };
}

test('creates merchants, vouchers, Better Luck, and Bonus Spin with complete stock allocations and published wheel', async () => {
  const db = database();
  await seedProductionProducts(db.client as any);
  expect(db.merchants.map(m => m.name)).toEqual(['TEXTWARE', 'Eventure', 'BIZBUDDY', 'Rich Look']);
  expect(db.rewards.map(r => [r.name, r.totalPhysicalStock])).toEqual([
    ['මනමාල කුරුල්ලෝ', 500], ['ජැක් සහ මායා බෝංචි වැල', 150],
    ['ගරු කටානයකතුමනි', 50], ['Doctors’ Night @ Sky Lounge', 90],
    ['Better Luck Next Time', 0], ['Bonus Spin', 0],
    ['BIZ BUDDY - SMART Web Profile', 7500],
    ['BIZ BUDDY - Online Web Store', 3500],
    ['BIZ BUDDY - BIZ Card Scanner', 3500],
    ['BIZ BUDDY - Web Landing Page', 3500],
    ['BIZ BUDDY - SMART Card', 3500],
    ['BIZ BUDDY - SMART Wristband', 3500],
    ['Rs 1000 gift voucher', 10],
  ]);
  const physicalRewards = db.rewards.filter(r => r.totalPhysicalStock > 0);
  for (const reward of physicalRewards) {
    if (reward.name.startsWith('BIZ BUDDY')) {
      expect(reward.merchantId).toBe('bizbuddy');
      expect(reward.colorHex).toBe('#0B132B');
    } else if (reward.name === 'Rs 1000 gift voucher') {
      expect(reward.merchantId).toBe('rich-look');
      expect(reward.colorHex).toBe('#FFFFFF');
    } else {
      expect(reward.merchantId).toBe('eventure');
    }
    expect(reward.type).toBe('VOUCHER');
    expect(reward.availablePhysicalStock).toBe(reward.totalPhysicalStock);
    expect(reward.shortLabel.length).toBeLessThanOrEqual(24);
    expect(db.allocations.filter(a => a.rewardId === reward.id).reduce((sum, a) => sum + a.allocatedQuantity, 0)).toBe(reward.totalPhysicalStock);
    expect(db.ledger.find(e => e.rewardId === reward.id).quantityDelta).toBe(reward.totalPhysicalStock);
  }
  const bonusSpin = db.rewards.find(r => r.name === 'Bonus Spin');
  expect(bonusSpin).toBeDefined();
  expect(bonusSpin.shortLabel).toBe('Spin Again');
  expect(bonusSpin.inventoryMode).toBe('NO_WIN');
  expect(bonusSpin.merchantId).toBeNull();

  const betterLuck = db.rewards.find(r => r.name === 'Better Luck Next Time');
  expect(betterLuck).toBeDefined();
  expect(betterLuck.shortLabel).toBe('Try Again');
  expect(betterLuck.merchantId).toBeNull();

  expect(db.wheelConfigs).toHaveLength(1);
  expect(db.wheelConfigs[0].isPublished).toBe(true);
  expect(db.wheelConfigs[0].slices.create).toHaveLength(12);
});

test('reruns preserve consumed stock and do not duplicate ledger entries or allocations', async () => {
  const db = database();
  await seedProductionProducts(db.client as any);
  db.rewards[0].availablePhysicalStock = 490;
  await seedProductionProducts(db.client as any);
  expect(db.rewards).toHaveLength(13);
  expect(db.rewards[0].availablePhysicalStock).toBe(490);
  expect(db.ledger).toHaveLength(11);
  expect(db.allocations).toHaveLength(33);
  expect(db.wheelConfigs).toHaveLength(1);
});

test('creates an admin with a hashed password and an exhibition with explicit days', async () => {
  const db = database();
  await seedProductionProducts(db.client as any);
  expect(db.users).toHaveLength(1);
  expect(db.users[0]).toMatchObject({ email: 'admin@example.com', name: 'Production Admin', role: 'ADMIN', isActive: true });
  expect(db.users[0].passwordHash).not.toBe(process.env.INITIAL_ADMIN_PASSWORD);
  expect(await bcrypt.compare(process.env.INITIAL_ADMIN_PASSWORD!, db.users[0].passwordHash)).toBe(true);
  expect(db.exhibitions).toEqual([expect.objectContaining({
    name: 'MobiOs Spin & Win @ INFOTEL',
    description: 'Flagship interactive exhibition experience for INFOTEL visitors',
    timezone: 'Asia/Colombo', pacingStartTime: '09:00:00', pacingEndTime: '21:00:00',
    isActive: true, isPaused: false,
  })]);
  expect(db.days.map(d => [d.dayNumber, d.date, d.label, d.status])).toEqual([
    [1, '2026-11-06', 'Day 1 - November 6', 'UPCOMING'],
    [2, '2026-11-07', 'Day 2 - November 7', 'UPCOMING'],
    [3, '2026-11-08', 'Day 3 - November 8', 'UPCOMING'],
  ]);
  expect(db.days.every(d => d.pacingStartTime === '09:00:00' && d.pacingEndTime === '21:00:00')).toBe(true);
});

test('reruns preserve admin credentials, exhibition settings, and day state', async () => {
  const db = database();
  await seedProductionProducts(db.client as any);
  db.users[0].passwordHash = 'changed-hash';
  db.users[0].isActive = false;
  db.exhibitions[0].isPaused = true;
  db.days[0].status = 'COMPLETED';
  db.days[0].pacingEndTime = '18:00:00';
  await seedProductionProducts(db.client as any);
  expect(db.users).toHaveLength(1);
  expect(db.users[0]).toMatchObject({ passwordHash: 'changed-hash', isActive: false });
  expect(db.exhibitions).toHaveLength(1);
  expect(db.exhibitions[0].isPaused).toBe(true);
  expect(db.days).toHaveLength(3);
  expect(db.days[0]).toMatchObject({ status: 'COMPLETED', pacingEndTime: '18:00:00' });
});

test.each(['INITIAL_ADMIN_EMAIL', 'INITIAL_ADMIN_PASSWORD'])('requires %s before writing any data', async key => {
  delete process.env[key];
  const db = database();
  await expect(seedProductionProducts(db.client as any)).rejects.toThrow(key);
  expect(db.users).toHaveLength(0);
  expect(db.exhibitions).toHaveLength(0);
  expect(db.merchants).toHaveLength(0);
});

test('uses configured exhibition settings and normalized admin email', async () => {
  process.env.INITIAL_ADMIN_EMAIL = ' Admin@Example.com ';
  process.env.SEED_EXHIBITION_NAME = 'Production Event';
  process.env.SEED_EXHIBITION_DESCRIPTION = 'Event description';
  process.env.DEFAULT_TIMEZONE = 'Asia/Singapore';
  process.env.DEFAULT_PACING_START_TIME = '10:00:00';
  process.env.DEFAULT_PACING_END_TIME = '18:00:00';
  const db = database();
  await seedProductionProducts(db.client as any);
  expect(db.users[0].email).toBe('admin@example.com');
  expect(db.exhibitions[0]).toMatchObject({
    name: 'Production Event', description: 'Event description', timezone: 'Asia/Singapore',
    pacingStartTime: '10:00:00', pacingEndTime: '18:00:00',
  });
  expect(db.days.every(d => d.pacingStartTime === '10:00:00' && d.pacingEndTime === '18:00:00')).toBe(true);
});

test('fills missing exhibition days without replacing configured days', async () => {
  const db = database();
  db.exhibitions.push({ id: 'expo', name: 'MobiOs Spin & Win @ INFOTEL', pacingStartTime: '08:00:00', pacingEndTime: '17:00:00' });
  db.days.push({ id: 'day1', exhibitionId: 'expo', dayNumber: 1, date: '2026-11-06', label: 'Opening Day', status: 'IN_PROGRESS' });
  await seedProductionProducts(db.client as any);
  expect(db.exhibitions).toHaveLength(1);
  expect(db.days).toHaveLength(3);
  expect(db.days[0]).toMatchObject({ label: 'Opening Day', status: 'IN_PROGRESS' });
  expect(db.days[1]).toMatchObject({ date: '2026-11-07', pacingStartTime: '08:00:00', pacingEndTime: '17:00:00' });
  expect(db.allocations).toHaveLength(33);
});
