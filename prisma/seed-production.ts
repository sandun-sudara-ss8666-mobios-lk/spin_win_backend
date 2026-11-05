import { PrismaClient } from '@prisma/client';

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
  // Keep product creation, initial stock, and allocations atomic.
  return prisma.$transaction(async (tx) => {
    const exhibition = await tx.exhibition.findFirst({
      where: { name: process.env.SEED_EXHIBITION_NAME || 'MobiOs Spin & Win @ INFOTEL' },
      include: { days: { orderBy: { dayNumber: 'asc' } } },
    });
    if (!exhibition?.days.length) {
      throw new Error('Configure exhibition days before running the production product seed. Set SEED_EXHIBITION_NAME to select the exhibition.');
    }

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
    .then(() => console.log('Production seed completed: TEXTWARE, Eventure, and Eventure rewards.'))
    .catch((error: unknown) => {
      console.error('Production seed failed:', error);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
