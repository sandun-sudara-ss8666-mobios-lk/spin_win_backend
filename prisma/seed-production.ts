import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// Fixed event dates: rerunning the seed in another year must not move the event.
const exhibitionDays = [
  { dayNumber: 1, date: '2026-11-06', label: 'Day 1 - November 6' },
  { dayNumber: 2, date: '2026-11-07', label: 'Day 2 - November 7' },
  { dayNumber: 3, date: '2026-11-08', label: 'Day 3 - November 8' },
];

const eventureRewards = [
  {
    name: 'මනමාල කුරුල්ලෝ',
    description: 'Discount මිල LKR 1000',
    shortLabel: 'මනමාල කුරුල්ලෝ',
    totalPhysicalStock: 500,
    colorHex: '#2563EB',
  },
  {
    name: 'ජැක් සහ මායා බෝංචි වැල',
    description: 'Innovation Drama | 25% OFF\nශ්‍රී ලංකාවේ ප්‍රථම Digitalized Theatre Experience එක',
    shortLabel: 'ජැක් සහ මායා බෝංචි වැල',
    totalPhysicalStock: 150,
    colorHex: '#8B5CF6',
  },
  {
    name: 'ගරු කටානයකතුමනි',
    description: '10% OFF',
    shortLabel: 'ගරු කටානයකතුමනි',
    totalPhysicalStock: 50,
    colorHex: '#10B981',
  },
  {
    name: 'Doctors’ Night @ Sky Lounge',
    description: '10% OFF',
    shortLabel: 'Doctors’ Night 10% OFF',
    totalPhysicalStock: 90,
    colorHex: '#F59E0B',
  },
];

export async function seedProductionProducts(prisma: PrismaClient) {
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD;
  if (!adminEmail) throw new Error('INITIAL_ADMIN_EMAIL is required for the production seed.');
  if (!adminPassword?.trim()) throw new Error('INITIAL_ADMIN_PASSWORD is required for the production seed.');
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const pacingStartTime = process.env.DEFAULT_PACING_START_TIME || '09:00:00';
  const pacingEndTime = process.env.DEFAULT_PACING_END_TIME || '21:00:00';

  // Keep setup, product creation, initial stock, and allocations atomic.
  return prisma.$transaction(async (tx) => {
    await tx.user.upsert({
      where: { email: adminEmail },
      update: {}, // Preserve existing credentials and account state on reruns.
      create: {
        email: adminEmail,
        passwordHash,
        name: process.env.INITIAL_ADMIN_NAME || 'MobiOs Infotel Admin',
        role: 'ADMIN',
        isActive: true,
      },
    });
    const exhibitionName = process.env.SEED_EXHIBITION_NAME || 'MobiOs Spin & Win @ INFOTEL';
    let exhibition = await tx.exhibition.findFirst({
      where: { name: exhibitionName },
      include: { days: { orderBy: { dayNumber: 'asc' } } },
    });
    if (!exhibition) {
      const created = await tx.exhibition.create({
        data: {
          name: exhibitionName,
          description: process.env.SEED_EXHIBITION_DESCRIPTION || 'Flagship interactive exhibition experience for INFOTEL visitors',
          timezone: process.env.DEFAULT_TIMEZONE || 'Asia/Colombo',
          pacingStartTime,
          pacingEndTime,
          isActive: true,
          isPaused: false,
        },
      });
      exhibition = { ...created, days: [] };
    }
    for (const day of exhibitionDays) {
      if (exhibition.days.some(existing => existing.dayNumber === day.dayNumber)) continue;
      const createdDay = await tx.exhibitionDay.upsert({
        where: { exhibitionId_dayNumber: { exhibitionId: exhibition.id, dayNumber: day.dayNumber } },
        update: {},
        create: {
          ...day,
          exhibitionId: exhibition.id,
          status: 'UPCOMING',
          pacingStartTime: exhibition.pacingStartTime,
          pacingEndTime: exhibition.pacingEndTime,
        },
      });
      exhibition.days.push(createdDay);
    }
    exhibition.days.sort((a, b) => a.dayNumber - b.dayNumber);

    await tx.merchant.upsert({
      where: { slug: 'textware' },
      update: {},
      create: { name: 'TEXTWARE', slug: 'textware' },
    });
    const eventure = await tx.merchant.upsert({
      where: { slug: 'eventure' },
      update: {},
      create: { name: 'Eventure', slug: 'eventure' },
    });

    for (const data of eventureRewards) {
      const existing = await tx.reward.findFirst({
        where: { merchantId: eventure.id, name: data.name },
      });
      // Never replenish consumed inventory or overwrite configured rewards on reruns.
      if (existing) continue;

      const reward = await tx.reward.create({
        data: {
          ...data,
          merchantId: eventure.id,
          type: 'VOUCHER',
          inventoryMode: 'LIMITED',
          distributionStrategy: 'AUTO_DAILY',
          availablePhysicalStock: data.totalPhysicalStock,
          carryForward: true,
          baselineWeight: 3,
          isActive: true,
        },
      });
      await tx.stockLedgerEntry.create({
        data: {
          rewardId: reward.id,
          entryType: 'INITIAL_STOCK',
          quantityDelta: data.totalPhysicalStock,
          balanceAfter: data.totalPhysicalStock,
          notes: 'Initial production seed stock',
          createdBy: 'PRODUCTION_SEED',
        },
      });

      const perDay = Math.floor(data.totalPhysicalStock / exhibition.days.length);
      const remainder = data.totalPhysicalStock % exhibition.days.length;
      await tx.dailyAllocation.createMany({
        data: exhibition.days.map((day, index) => ({
          rewardId: reward.id,
          exhibitionDayId: day.id,
          allocatedQuantity: perDay + (index === 0 ? remainder : 0),
        })),
      });
    }
  });
}

if (require.main === module) {
  const prisma = new PrismaClient();
  seedProductionProducts(prisma)
    .then(() => console.log('Production seed completed: admin, exhibition, days, TEXTWARE, Eventure, and Eventure rewards.'))
    .catch((error: unknown) => {
      console.error('Production seed failed:', error);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
