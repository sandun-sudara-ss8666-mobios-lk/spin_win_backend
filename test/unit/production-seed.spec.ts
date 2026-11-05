import { seedProductionProducts } from '../../prisma/seed-production';

function database() {
  const merchants: any[] = [];
  const rewards: any[] = [];
  const ledger: any[] = [];
  const allocations: any[] = [];
  const tx = {
    exhibition: { findFirst: jest.fn(async () => ({ id: 'expo', days: [{ id: 'day1' }, { id: 'day2' }, { id: 'day3' }] })) },
    merchant: { upsert: jest.fn(async ({ create }: any) => {
      let merchant = merchants.find(m => m.slug === create.slug);
      if (!merchant) { merchant = { ...create, id: create.slug }; merchants.push(merchant); }
      return merchant;
    }) },
    reward: {
      findFirst: jest.fn(async ({ where }: any) => rewards.find(r => r.name === where.name && r.merchantId === where.merchantId)),
      create: jest.fn(async ({ data }: any) => { const reward = { ...data, id: `reward-${rewards.length}` }; rewards.push(reward); return reward; }),
    },
    stockLedgerEntry: { create: jest.fn(async ({ data }: any) => ledger.push(data)) },
    dailyAllocation: { createMany: jest.fn(async ({ data }: any) => allocations.push(...data)) },
  };
  return { merchants, rewards, ledger, allocations, tx, client: { $transaction: async (fn: any) => fn(tx) } };
}

test('creates both merchants and four Eventure vouchers with complete stock allocations', async () => {
  const db = database();
  await seedProductionProducts(db.client as any);
  expect(db.merchants.map(m => m.name)).toEqual(['TEXTWARE', 'Eventure']);
  expect(db.rewards.map(r => [r.name, r.totalPhysicalStock])).toEqual([
    ['මනමාල කුරුල්ලෝ', 500], ['ජැක් සහ මායා බෝංචි වැල', 150],
    ['ගරු කටානයකතුමනි', 50], ['Doctors’ Night @ Sky Lounge', 90],
  ]);
  for (const reward of db.rewards) {
    expect(reward.merchantId).toBe('eventure');
    expect(reward.type).toBe('VOUCHER');
    expect(reward.availablePhysicalStock).toBe(reward.totalPhysicalStock);
    expect(reward.shortLabel.length).toBeLessThanOrEqual(24);
    expect(db.allocations.filter(a => a.rewardId === reward.id).reduce((sum, a) => sum + a.allocatedQuantity, 0)).toBe(reward.totalPhysicalStock);
    expect(db.ledger.find(e => e.rewardId === reward.id).quantityDelta).toBe(reward.totalPhysicalStock);
  }
});

test('reruns preserve consumed stock and do not duplicate ledger entries or allocations', async () => {
  const db = database();
  await seedProductionProducts(db.client as any);
  db.rewards[0].availablePhysicalStock = 490;
  await seedProductionProducts(db.client as any);
  expect(db.rewards).toHaveLength(4);
  expect(db.rewards[0].availablePhysicalStock).toBe(490);
  expect(db.ledger).toHaveLength(4);
  expect(db.allocations).toHaveLength(12);
});

test('requires configured exhibition days before creating product data', async () => {
  const db = database();
  db.tx.exhibition.findFirst.mockResolvedValue(null as any);
  await expect(seedProductionProducts(db.client as any)).rejects.toThrow('exhibition days');
  expect(db.merchants).toHaveLength(0);
});
