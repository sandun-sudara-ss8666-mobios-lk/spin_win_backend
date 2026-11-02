"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting MobiOs Spin & Win database seed...');
    const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@mobios.lk';
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'AdminPassword@2026';
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            name: process.env.INITIAL_ADMIN_NAME || 'MobiOs Infotel Admin',
            passwordHash,
            isActive: true,
        },
        create: {
            email: adminEmail,
            name: process.env.INITIAL_ADMIN_NAME || 'MobiOs Infotel Admin',
            passwordHash,
            role: 'ADMIN',
            isActive: true,
        },
    });
    console.log(`✅ Admin user seeded: ${admin.email}`);
    const currentYear = new Date().getFullYear();
    let exhibition = await prisma.exhibition.findFirst({
        where: { name: 'MobiOs Spin & Win @ INFOTEL' },
    });
    if (!exhibition) {
        exhibition = await prisma.exhibition.create({
            data: {
                name: 'MobiOs Spin & Win @ INFOTEL',
                description: 'Flagship interactive exhibition experience for INFOTEL visitors',
                timezone: 'Asia/Colombo',
                isActive: true,
                isPaused: false,
                pacingStartTime: '09:00:00',
                pacingEndTime: '21:00:00',
            },
        });
    }
    const daysConfig = [
        { dayNumber: 1, date: `${currentYear}-11-06`, label: 'Day 1 - November 6' },
        { dayNumber: 2, date: `${currentYear}-11-07`, label: 'Day 2 - November 7' },
        { dayNumber: 3, date: `${currentYear}-11-08`, label: 'Day 3 - November 8' },
    ];
    const seededDays = [];
    for (const d of daysConfig) {
        const day = await prisma.exhibitionDay.upsert({
            where: {
                exhibitionId_dayNumber: {
                    exhibitionId: exhibition.id,
                    dayNumber: d.dayNumber,
                },
            },
            update: {
                label: d.label,
                date: d.date,
                pacingStartTime: '09:00:00',
                pacingEndTime: '21:00:00',
            },
            create: {
                exhibitionId: exhibition.id,
                dayNumber: d.dayNumber,
                date: d.date,
                label: d.label,
                status: 'UPCOMING',
                pacingStartTime: '09:00:00',
                pacingEndTime: '21:00:00',
            },
        });
        seededDays.push(day);
    }
    console.log(`✅ ${seededDays.length} Exhibition days seeded`);
    const merchantsData = [
        {
            name: 'MobiOs',
            slug: 'mobios',
            primaryColor: '#0052CC',
            contactEmail: 'contact@mobios.lk',
            logoUrl: 'https://cdn.mobios.lk/branding/mobios-logo.png',
        },
        {
            name: 'Samsung',
            slug: 'samsung',
            primaryColor: '#1428A0',
            contactEmail: 'events@samsung.lk',
            logoUrl: 'https://cdn.mobios.lk/branding/samsung-logo.png',
        },
        {
            name: 'Dialog Axiata',
            slug: 'dialog',
            primaryColor: '#E60000',
            contactEmail: 'promo@dialog.lk',
            logoUrl: 'https://cdn.mobios.lk/branding/dialog-logo.png',
        },
        {
            name: 'Singer Sri Lanka',
            slug: 'singer',
            primaryColor: '#D92228',
            contactEmail: 'infotel@singersl.com',
            logoUrl: 'https://cdn.mobios.lk/branding/singer-logo.png',
        },
    ];
    const merchantMap = new Map();
    for (const m of merchantsData) {
        const merchant = await prisma.merchant.upsert({
            where: { slug: m.slug },
            update: {
                name: m.name,
                primaryColor: m.primaryColor,
                contactEmail: m.contactEmail,
                logoUrl: m.logoUrl,
            },
            create: m,
        });
        merchantMap.set(m.slug, merchant.id);
    }
    console.log(`✅ ${merchantsData.length} Merchants seeded`);
    const rewardsData = [
        {
            slug: 'galaxy-fit3',
            merchantSlug: 'samsung',
            name: 'Samsung Galaxy Fit 3',
            shortLabel: 'Galaxy Fit 3',
            type: 'PHYSICAL',
            inventoryMode: 'LIMITED',
            distributionStrategy: 'AUTO_DAILY',
            totalPhysicalStock: 30,
            baselineWeight: 1,
            colorHex: '#3B82F6',
        },
        {
            slug: 'dialog-50gb',
            merchantSlug: 'dialog',
            name: 'Dialog 50GB Data Card',
            shortLabel: '50GB Data',
            type: 'VOUCHER',
            inventoryMode: 'LIMITED',
            distributionStrategy: 'AUTO_DAILY',
            totalPhysicalStock: 60,
            baselineWeight: 3,
            colorHex: '#EF4444',
        },
        {
            slug: 'mobios-powerbank',
            merchantSlug: 'mobios',
            name: 'MobiOs 10000mAh Power Bank',
            shortLabel: 'Power Bank',
            type: 'MERCHANDISE',
            inventoryMode: 'LIMITED',
            distributionStrategy: 'AUTO_DAILY',
            totalPhysicalStock: 45,
            baselineWeight: 2,
            colorHex: '#10B981',
        },
        {
            slug: 'singer-voucher',
            merchantSlug: 'singer',
            name: 'Singer Rs. 2,000 Shopping Voucher',
            shortLabel: 'Singer 2K',
            type: 'VOUCHER',
            inventoryMode: 'LIMITED',
            distributionStrategy: 'AUTO_DAILY',
            totalPhysicalStock: 90,
            baselineWeight: 4,
            colorHex: '#F59E0B',
        },
        {
            slug: 'mobios-tshirt',
            merchantSlug: 'mobios',
            name: 'MobiOs Limited Edition T-Shirt',
            shortLabel: 'MobiOs T-Shirt',
            type: 'MERCHANDISE',
            inventoryMode: 'LIMITED',
            distributionStrategy: 'AUTO_DAILY',
            totalPhysicalStock: 60,
            baselineWeight: 3,
            colorHex: '#8B5CF6',
        },
        {
            slug: 'mobios-tech-pouch',
            merchantSlug: 'mobios',
            name: 'MobiOs Waterproof Tech Pouch',
            shortLabel: 'Tech Pouch',
            type: 'MERCHANDISE',
            inventoryMode: 'LIMITED',
            distributionStrategy: 'AUTO_DAILY',
            totalPhysicalStock: 75,
            baselineWeight: 3,
            colorHex: '#06B6D4',
        },
        {
            slug: 'mobios-metal-pen',
            merchantSlug: 'mobios',
            name: 'MobiOs Engraved Metal Pen',
            shortLabel: 'Stylus Pen',
            type: 'MERCHANDISE',
            inventoryMode: 'LIMITED',
            distributionStrategy: 'AUTO_DAILY',
            totalPhysicalStock: 150,
            baselineWeight: 5,
            colorHex: '#64748B',
        },
        {
            slug: 'mobios-keyring',
            merchantSlug: 'mobios',
            name: 'MobiOs Metal Keyring & Tool',
            shortLabel: 'Keyring Tool',
            type: 'MERCHANDISE',
            inventoryMode: 'LIMITED',
            distributionStrategy: 'AUTO_DAILY',
            totalPhysicalStock: 150,
            baselineWeight: 5,
            colorHex: '#EC4899',
        },
        {
            slug: 'digital-badge',
            merchantSlug: 'mobios',
            name: 'Digital VIP Badge & Wallpaper',
            shortLabel: 'VIP Pass',
            type: 'VOUCHER',
            inventoryMode: 'UNLIMITED',
            distributionStrategy: 'EXHIBITION_WIDE',
            totalPhysicalStock: 0,
            baselineWeight: 6,
            colorHex: '#6366F1',
        },
        {
            slug: 'no-win-spin',
            merchantSlug: 'mobios',
            name: 'Better Luck Next Time',
            shortLabel: 'Try Again',
            type: 'NO_WIN',
            inventoryMode: 'NO_WIN',
            distributionStrategy: 'EXHIBITION_WIDE',
            totalPhysicalStock: 0,
            baselineWeight: 8,
            colorHex: '#94A3B8',
        },
    ];
    const rewardSlugMap = new Map();
    for (const r of rewardsData) {
        let reward = await prisma.reward.findFirst({
            where: { name: r.name },
        });
        const merchantId = merchantMap.get(r.merchantSlug) || null;
        if (!reward) {
            reward = await prisma.reward.create({
                data: {
                    merchantId,
                    name: r.name,
                    shortLabel: r.shortLabel,
                    type: r.type,
                    inventoryMode: r.inventoryMode,
                    distributionStrategy: r.distributionStrategy,
                    totalPhysicalStock: r.totalPhysicalStock,
                    availablePhysicalStock: r.totalPhysicalStock,
                    carryForward: true,
                    baselineWeight: r.baselineWeight,
                    colorHex: r.colorHex,
                    isActive: true,
                },
            });
            if (r.totalPhysicalStock > 0) {
                await prisma.stockLedgerEntry.create({
                    data: {
                        rewardId: reward.id,
                        entryType: 'INITIAL_STOCK',
                        quantityDelta: r.totalPhysicalStock,
                        balanceAfter: r.totalPhysicalStock,
                        notes: 'Initial seed stock',
                        createdBy: 'SEED',
                    },
                });
            }
            const perDay = Math.floor(r.totalPhysicalStock / 3);
            const remainder = r.totalPhysicalStock % 3;
            for (let i = 0; i < seededDays.length; i++) {
                const day = seededDays[i];
                const allocated = perDay + (i === 0 ? remainder : 0);
                await prisma.dailyAllocation.create({
                    data: {
                        rewardId: reward.id,
                        exhibitionDayId: day.id,
                        allocatedQuantity: allocated,
                        carriedForwardQuantity: 0,
                        awardedQuantity: 0,
                    },
                });
            }
        }
        rewardSlugMap.set(r.slug, reward.id);
    }
    console.log(`✅ ${rewardsData.length} Rewards & daily allocations seeded`);
    const existingConfig = await prisma.wheelConfig.findFirst({
        where: { version: 1 },
    });
    if (!existingConfig) {
        const slices = [
            { sliceIndex: 0, slug: 'galaxy-fit3', isNoWin: false, label: 'Samsung Fit 3', bg: '#2563EB', text: '#FFFFFF' },
            { sliceIndex: 1, slug: 'mobios-metal-pen', isNoWin: false, label: 'Stylus Pen', bg: '#475569', text: '#FFFFFF' },
            { sliceIndex: 2, slug: 'dialog-50gb', isNoWin: false, label: 'Dialog 50GB', bg: '#DC2626', text: '#FFFFFF' },
            { sliceIndex: 3, slug: 'no-win-spin', isNoWin: true, label: 'Try Again', bg: '#64748B', text: '#FFFFFF' },
            { sliceIndex: 4, slug: 'mobios-powerbank', isNoWin: false, label: 'Power Bank', bg: '#059669', text: '#FFFFFF' },
            { sliceIndex: 5, slug: 'mobios-keyring', isNoWin: false, label: 'Keyring Tool', bg: '#DB2777', text: '#FFFFFF' },
            { sliceIndex: 6, slug: 'singer-voucher', isNoWin: false, label: 'Singer 2K', bg: '#D97706', text: '#FFFFFF' },
            { sliceIndex: 7, slug: 'digital-badge', isNoWin: false, label: 'VIP Pass', bg: '#4F46E5', text: '#FFFFFF' },
            { sliceIndex: 8, slug: 'mobios-tshirt', isNoWin: false, label: 'T-Shirt', bg: '#7C3AED', text: '#FFFFFF' },
            { sliceIndex: 9, slug: 'no-win-spin', isNoWin: true, label: 'Try Again', bg: '#64748B', text: '#FFFFFF' },
            { sliceIndex: 10, slug: 'mobios-tech-pouch', isNoWin: false, label: 'Tech Pouch', bg: '#0891B2', text: '#FFFFFF' },
            { sliceIndex: 11, slug: 'mobios-metal-pen', isNoWin: false, label: 'Stylus Pen', bg: '#475569', text: '#FFFFFF' },
        ];
        await prisma.wheelConfig.create({
            data: {
                version: 1,
                name: 'INFOTEL 2026 Default 12-Slice Wheel',
                sliceCount: 12,
                isPublished: true,
                createdBy: 'SEED',
                slices: {
                    create: slices.map((s) => ({
                        sliceIndex: s.sliceIndex,
                        rewardId: rewardSlugMap.get(s.slug) || null,
                        isNoWin: s.isNoWin,
                        label: s.label,
                        backgroundColor: s.bg,
                        textColor: s.text,
                    })),
                },
            },
        });
        console.log('✅ Default 12-Slice published wheel configuration seeded');
    }
    console.log('🎉 Seeding completed successfully!');
}
main()
    .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map