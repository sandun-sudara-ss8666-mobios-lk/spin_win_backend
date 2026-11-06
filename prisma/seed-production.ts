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
    type: 'VOUCHER' as const,
    inventoryMode: 'LIMITED' as const,
  },
  {
    name: 'ජැක් සහ මායා බෝංචි වැල',
    description: 'Innovation Drama | 25% OFF\nශ්‍රී ලංකාවේ ප්‍රථම Digitalized Theatre Experience එක',
    shortLabel: 'ජැක් සහ මායා බෝංචි වැල',
    totalPhysicalStock: 150,
    colorHex: '#8B5CF6',
    type: 'VOUCHER' as const,
    inventoryMode: 'LIMITED' as const,
  },
  {
    name: 'ගරු කටානයකතුමනි',
    description: '10% OFF',
    shortLabel: 'ගරු කටානයකතුමනි',
    totalPhysicalStock: 50,
    colorHex: '#10B981',
    type: 'VOUCHER' as const,
    inventoryMode: 'LIMITED' as const,
  },
  {
    name: 'Doctors’ Night @ Sky Lounge',
    description: '10% OFF',
    shortLabel: 'Doctors’ Night 10% OFF',
    totalPhysicalStock: 90,
    colorHex: '#F59E0B',
    type: 'VOUCHER' as const,
    inventoryMode: 'LIMITED' as const,
  },
  {
    name: 'Better Luck Next Time',
    description: 'Thank you for participating with MobiOs at INFOTEL!',
    shortLabel: 'Try Again',
    totalPhysicalStock: 0,
    colorHex: '#64748B',
    type: 'NO_WIN' as const,
    inventoryMode: 'NO_WIN' as const,
  },
  {
    name: 'Bonus Spin',
    description: 'Congratulations! You earned another chance to spin the wheel!',
    shortLabel: 'Spin Again',
    totalPhysicalStock: 0,
    colorHex: '#06B6D4',
    type: 'NO_WIN' as const,
    inventoryMode: 'NO_WIN' as const,
  },
];

const bizbuddyRewards = [
  {
    name: 'BIZ BUDDY - SMART Web Profile',
    description: 'KICK START Package 100% FREE',
    shortLabel: 'SMART Web Profile',
    totalPhysicalStock: 7500,
    colorHex: '#0B132B',
    type: 'VOUCHER' as const,
    inventoryMode: 'LIMITED' as const,
  },
  {
    name: 'BIZ BUDDY - Online Web Store',
    description: 'KICK START Intro package 20% off.',
    shortLabel: 'Online Web Store',
    totalPhysicalStock: 3500,
    colorHex: '#0B132B',
    type: 'VOUCHER' as const,
    inventoryMode: 'LIMITED' as const,
  },
  {
    name: 'BIZ BUDDY - BIZ Card Scanner',
    description: 'KICK START Intro package 20% off.',
    shortLabel: 'BIZ Card Scanner',
    totalPhysicalStock: 3500,
    colorHex: '#0B132B',
    type: 'VOUCHER' as const,
    inventoryMode: 'LIMITED' as const,
  },
  {
    name: 'BIZ BUDDY - Web Landing Page',
    description: 'KICK START Intro package 20% off.',
    shortLabel: 'Web Landing Page',
    totalPhysicalStock: 3500,
    colorHex: '#0B132B',
    type: 'VOUCHER' as const,
    inventoryMode: 'LIMITED' as const,
  },
  {
    name: 'BIZ BUDDY - SMART Card',
    description: 'KICK START Intro package 20% off.',
    shortLabel: 'SMART Card',
    totalPhysicalStock: 3500,
    colorHex: '#0B132B',
    type: 'VOUCHER' as const,
    inventoryMode: 'LIMITED' as const,
  },
  {
    name: 'BIZ BUDDY - SMART Wristband',
    description: 'KICK START Intro package 20% off.',
    shortLabel: 'SMART Wristband',
    totalPhysicalStock: 3500,
    colorHex: '#0B132B',
    type: 'VOUCHER' as const,
    inventoryMode: 'LIMITED' as const,
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
    const bizbuddy = await tx.merchant.upsert({
      where: { slug: 'bizbuddy' },
      update: {},
      create: { name: 'BIZBUDDY', slug: 'bizbuddy', primaryColor: '#0B132B' },
    });

    const rewardsToSeed = [
      ...eventureRewards.map(r => ({
        ...r,
        targetMerchantId: (r.name === 'Better Luck Next Time' || r.name === 'Bonus Spin') ? null : eventure.id,
        isDirectReward: (r.name === 'Better Luck Next Time' || r.name === 'Bonus Spin'),
      })),
      ...bizbuddyRewards.map(r => ({
        ...r,
        targetMerchantId: bizbuddy.id,
        isDirectReward: false,
      })),
    ];

    for (const data of rewardsToSeed) {
      const existing = await tx.reward.findFirst({
        where: data.isDirectReward ? { name: data.name } : { merchantId: data.targetMerchantId, name: data.name },
      });
      // If existing direct reward previously had a merchant attached, clear it to null
      if (existing) {
        if (data.isDirectReward && existing.merchantId !== null) {
          await tx.reward.update({
            where: { id: existing.id },
            data: { merchantId: null },
          });
        }
        continue;
      }

      const reward = await tx.reward.create({
        data: {
          name: data.name,
          description: data.description,
          shortLabel: data.shortLabel,
          colorHex: data.colorHex,
          merchantId: data.targetMerchantId,
          type: data.type,
          inventoryMode: data.inventoryMode,
          distributionStrategy: data.totalPhysicalStock > 0 ? 'AUTO_DAILY' : 'EXHIBITION_WIDE',
          totalPhysicalStock: data.totalPhysicalStock,
          availablePhysicalStock: data.totalPhysicalStock,
          carryForward: true,
          baselineWeight: 3,
          isActive: true,
        },
      });

      if (data.totalPhysicalStock > 0) {
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
    }

    // Default Published 12-Slice Wheel Configuration for Production
    let publishedWheel = await tx.wheelConfig.findFirst({
      where: { isPublished: true },
    });

    if (!publishedWheel) {
      const allSeededRewards = await tx.reward.findMany();
      const rewardMap = new Map(allSeededRewards.map(r => [r.name, r.id]));

      const mKurulloId = rewardMap.get('මනමාල කුරුල්ලෝ');
      const jBeanstalkId = rewardMap.get('ජැක් සහ මායා බෝංචි වැල');
      const gKathanayakaId = rewardMap.get('ගරු කටානයකතුමනි');
      const dNightId = rewardMap.get('Doctors’ Night @ Sky Lounge');
      const betterLuckId = rewardMap.get('Better Luck Next Time');
      const bonusSpinId = rewardMap.get('Bonus Spin');

      const slices = [
        { sliceIndex: 0, rewardId: mKurulloId, isNoWin: false, label: 'මනමාල කුරුල්ලෝ', bg: '#2563EB', text: '#FFFFFF' },
        { sliceIndex: 1, rewardId: betterLuckId, isNoWin: true, label: 'Try Again', bg: '#64748B', text: '#FFFFFF' },
        { sliceIndex: 2, rewardId: jBeanstalkId, isNoWin: false, label: 'ජැක් සහ මායා බෝංචි වැල', bg: '#8B5CF6', text: '#FFFFFF' },
        { sliceIndex: 3, rewardId: bonusSpinId, isNoWin: false, label: 'Spin Again', bg: '#06B6D4', text: '#FFFFFF' },
        { sliceIndex: 4, rewardId: gKathanayakaId, isNoWin: false, label: 'ගරු කටානයකතුමනි', bg: '#10B981', text: '#FFFFFF' },
        { sliceIndex: 5, rewardId: betterLuckId, isNoWin: true, label: 'Try Again', bg: '#64748B', text: '#FFFFFF' },
        { sliceIndex: 6, rewardId: dNightId, isNoWin: false, label: 'Doctors’ Night', bg: '#F59E0B', text: '#FFFFFF' },
        { sliceIndex: 7, rewardId: bonusSpinId, isNoWin: false, label: 'Spin Again', bg: '#06B6D4', text: '#FFFFFF' },
        { sliceIndex: 8, rewardId: mKurulloId, isNoWin: false, label: 'මනමාල කුරුල්ලෝ', bg: '#2563EB', text: '#FFFFFF' },
        { sliceIndex: 9, rewardId: betterLuckId, isNoWin: true, label: 'Try Again', bg: '#64748B', text: '#FFFFFF' },
        { sliceIndex: 10, rewardId: jBeanstalkId, isNoWin: false, label: 'ජැක් සහ මායා බෝංචි වැල', bg: '#8B5CF6', text: '#FFFFFF' },
        { sliceIndex: 11, rewardId: bonusSpinId, isNoWin: false, label: 'Spin Again', bg: '#06B6D4', text: '#FFFFFF' },
      ];

      await tx.wheelConfig.create({
        data: {
          version: 1,
          name: 'INFOTEL Production 12-Slice Wheel',
          sliceCount: 12,
          isPublished: true,
          createdBy: 'PRODUCTION_SEED',
          slices: {
            create: slices.map(s => ({
              sliceIndex: s.sliceIndex,
              rewardId: s.rewardId || null,
              isNoWin: s.isNoWin,
              label: s.label,
              backgroundColor: s.bg,
              textColor: s.text,
            })),
          },
        },
      });
    }
  });
}

if (require.main === module) {
  const prisma = new PrismaClient();
  seedProductionProducts(prisma)
    .then(() => console.log('Production seed completed: admin, exhibition, days, TEXTWARE, Eventure, BIZBUDDY, and rewards.'))
    .catch((error: unknown) => {
      console.error('Production seed failed:', error);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
