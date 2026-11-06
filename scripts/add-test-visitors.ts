import { PrismaClient, ParticipationStatus } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

const firstNames = [
  'Kasun', 'Nuwan', 'Tharindu', 'Chamari', 'Dinuka', 'Dilshan', 'Sanduni',
  'Kavindu', 'Oshada', 'Sachini', 'Mahesh', 'Gayan', 'Anushka', 'Ishara',
  'Praveen', 'Nadeesha', 'Chathura', 'Malithi', 'Roshan', 'Thilini',
  'Lahiru', 'Shenal', 'Ruvini', 'Buddhika', 'Pavithra', 'Sahan', 'Nipuni',
  'Dimuth', 'Hansani', 'Supun', 'Kalani', 'Dhanushka', 'Dulani', 'Janaka',
  'Harshani', 'Sameera', 'Hashini', 'Asanka', 'Sewwandi', 'Prasad',
];

const lastNames = [
  'Perera', 'Silva', 'Fernando', 'Jayawardena', 'Mendis', 'Wickramasinghe',
  'Fonseka', 'Senanayake', 'Rajapaksa', 'Gunasekara', 'Dissanayake',
  'Bandara', 'Alwis', 'Karunaratne', 'Herath', 'Gamage', 'Ranasinghe',
  'Weerasinghe', 'Kulasekara', 'Samaraweera', 'Abeysekara', 'Pathirana',
];

function generateReadableRef(existingRefs: Set<string>): string {
  const chars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  let ref = '';
  do {
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(crypto.randomInt(0, chars.length));
    }
    ref = `SPIN-${code}`;
  } while (existingRefs.has(ref));
  existingRefs.add(ref);
  return ref;
}

async function main() {
  console.log('🚀 Preparing to add 100 test visitors for the spinner queue...');

  // 1. Locate the exhibition day (prefer active day IN_PROGRESS, fallback to day 1)
  let day = await prisma.exhibitionDay.findFirst({
    where: { status: 'IN_PROGRESS' },
  });

  if (!day) {
    day = await prisma.exhibitionDay.findFirst({
      where: { dayNumber: 1 },
    });
  }

  if (!day) {
    day = await prisma.exhibitionDay.findFirst({
      orderBy: { dayNumber: 'asc' },
    });
  }

  if (!day) {
    console.error('❌ No exhibition day found in the database. Please ensure exhibition days are seeded first.');
    process.exit(1);
  }

  console.log(`📍 Target Exhibition Day: Day ${day.dayNumber} (${day.label}) - Status: ${day.status}`);

  // 2. Fetch existing readable refs to prevent collisions
  const existingRecords = await prisma.participation.findMany({
    select: { readableRef: true },
  });
  const existingRefs = new Set(existingRecords.map((r) => r.readableRef));

  const count = 100;
  const now = Date.now();
  const visitorsToInsert: Array<{
    readableRef: string;
    exhibitionDayId: string;
    visitorName: string;
    visitorPhone: string;
    visitorPhoneRaw: string;
    status: ParticipationStatus;
    registeredAt: Date;
  }> = [];

  for (let i = 1; i <= count; i++) {
    const fName = firstNames[crypto.randomInt(0, firstNames.length)];
    const lName = lastNames[crypto.randomInt(0, lastNames.length)];
    const visitorName = `${fName} ${lName}`;

    // Unique phone number per visitor: e.g. 0771000001 -> +94771000001
    const phoneSuffix = String(1000000 + (existingRecords.length + i)).slice(-7);
    const rawPhone = `077${phoneSuffix}`;
    const normalizedPhone = `+9477${phoneSuffix}`;

    const readableRef = generateReadableRef(existingRefs);
    // Stagger registeredAt by a few seconds so queue order is deterministic
    const registeredAt = new Date(now - (count - i) * 3000);

    visitorsToInsert.push({
      readableRef,
      exhibitionDayId: day.id,
      visitorName,
      visitorPhone: normalizedPhone,
      visitorPhoneRaw: rawPhone,
      status: 'WAITING' as ParticipationStatus,
      registeredAt,
    });
  }

  // 3. Batch insert using createMany
  const result = await prisma.participation.createMany({
    data: visitorsToInsert,
  });

  console.log(`✅ Successfully added ${result.count} test visitors to the queue!`);
  console.log(`📋 Sample visitors added:`);
  visitorsToInsert.slice(0, 5).forEach((v, idx) => {
    console.log(`   ${idx + 1}. [${v.readableRef}] ${v.visitorName} (${v.visitorPhoneRaw})`);
  });
  console.log(`   ... and ${count - 5} more.`);
  console.log(`\n🎉 Refresh your Wheel Stage display or queue to see all 100 test visitors!`);
}

main()
  .catch((e) => {
    console.error('❌ Error inserting test visitors:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
