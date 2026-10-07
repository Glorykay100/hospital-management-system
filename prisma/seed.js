// prisma/seed.js
'use strict';

const { PrismaClient, AssignmentStatus } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Wards ──────────────────────────────────────────────────────────────────
  const [wardGeneral, wardICU, wardMaternity, wardPediatric] = await Promise.all([
    prisma.ward.upsert({
      where: { name: 'General Ward A' },
      update: {},
      create: { name: 'General Ward A', wardType: 'General', capacity: 10, currentOccupancy: 0 },
    }),
    prisma.ward.upsert({
      where: { name: 'ICU Unit 1' },
      update: {},
      create: { name: 'ICU Unit 1', wardType: 'ICU', capacity: 4, currentOccupancy: 0 },
    }),
    prisma.ward.upsert({
      where: { name: 'Maternity Wing' },
      update: {},
      create: { name: 'Maternity Wing', wardType: 'Maternity', capacity: 6, currentOccupancy: 0 },
    }),
    prisma.ward.upsert({
      where: { name: 'Pediatric Ward' },
      update: {},
      create: { name: 'Pediatric Ward', wardType: 'Pediatric', capacity: 8, currentOccupancy: 0 },
    }),
  ]);

  // ── Patients ───────────────────────────────────────────────────────────────
  const [p1, p2, p3, p4, p5] = await Promise.all([
    prisma.patient.upsert({
      where: { email: 'amara.okafor@example.com' },
      update: {},
      create: {
        fullName: 'Amara Okafor',
        dateOfBirth: new Date('1988-03-14'),
        gender: 'female',
        phone: '+2348001001001',
        email: 'amara.okafor@example.com',
        address: '12 Adeola Odeku St, Lagos',
      },
    }),
    prisma.patient.upsert({
      where: { email: 'james.mbeki@example.com' },
      update: {},
      create: {
        fullName: 'James Mbeki',
        dateOfBirth: new Date('1975-11-22'),
        gender: 'male',
        phone: '+2348001001002',
        email: 'james.mbeki@example.com',
        address: '45 Herbert Macaulay Way, Abuja',
      },
    }),
    prisma.patient.upsert({
      where: { email: 'fatima.hassan@example.com' },
      update: {},
      create: {
        fullName: 'Fatima Hassan',
        dateOfBirth: new Date('1995-07-08'),
        gender: 'female',
        phone: '+2348001001003',
        email: 'fatima.hassan@example.com',
        address: '8 Ahmadu Bello Way, Kano',
      },
    }),
    prisma.patient.upsert({
      where: { email: 'chukwuemeka.nwosu@example.com' },
      update: {},
      create: {
        fullName: 'Chukwuemeka Nwosu',
        dateOfBirth: new Date('1962-01-30'),
        gender: 'male',
        phone: '+2348001001004',
        email: 'chukwuemeka.nwosu@example.com',
        address: '3 Ogui Road, Enugu',
      },
    }),
    prisma.patient.upsert({
      where: { email: 'ngozi.adeyemi@example.com' },
      update: {},
      create: {
        fullName: 'Ngozi Adeyemi',
        dateOfBirth: new Date('2001-09-15'),
        gender: 'female',
        phone: '+2348001001005',
        email: 'ngozi.adeyemi@example.com',
        address: '77 Awolowo Road, Ibadan',
      },
    }),
  ]);

  // ── Doctors ────────────────────────────────────────────────────────────────
  const [doc1, doc2, doc3, doc4] = await Promise.all([
    prisma.doctor.upsert({
      where: { email: 'dr.ibrahim.aliyu@hospital.com' },
      update: {},
      create: {
        fullName: 'Dr. Ibrahim Aliyu',
        specialization: 'Cardiology',
        email: 'dr.ibrahim.aliyu@hospital.com',
        phone: '+2348009001001',
      },
    }),
    prisma.doctor.upsert({
      where: { email: 'dr.chisom.eze@hospital.com' },
      update: {},
      create: {
        fullName: 'Dr. Chisom Eze',
        specialization: 'Pediatrics',
        email: 'dr.chisom.eze@hospital.com',
        phone: '+2348009001002',
      },
    }),
    prisma.doctor.upsert({
      where: { email: 'dr.aisha.musa@hospital.com' },
      update: {},
      create: {
        fullName: 'Dr. Aisha Musa',
        specialization: 'Obstetrics',
        email: 'dr.aisha.musa@hospital.com',
        phone: '+2348009001003',
      },
    }),
    prisma.doctor.upsert({
      where: { email: 'dr.tunde.adeyinka@hospital.com' },
      update: {},
      create: {
        fullName: 'Dr. Tunde Adeyinka',
        specialization: 'Internal Medicine',
        email: 'dr.tunde.adeyinka@hospital.com',
        phone: '+2348009001004',
      },
    }),
  ]);

  // ── Assignments ─────────────────────────────────────────────────────────────
  // Delete existing seed assignments to stay idempotent
  await prisma.assignment.deleteMany({
    where: { notes: { startsWith: '[seed]' } },
  });

  // Reset occupancy before re-seeding
  await prisma.ward.updateMany({ data: { currentOccupancy: 0 } });

  // Assignment 1 — active
  await prisma.assignment.create({
    data: {
      patientId: p1.id,
      wardId: wardGeneral.id,
      doctorId: doc1.id,
      status: 'active',
      notes: '[seed] Admitted for cardiac observation.',
    },
  });

  // Assignment 2 — discharged
  await prisma.assignment.create({
    data: {
      patientId: p2.id,
      wardId: wardICU.id,
      doctorId: doc4.id,
      status: 'discharged',
      assignedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      dischargedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      notes: '[seed] Post-operative monitoring, now discharged.',
    },
  });

  // Assignment 3 — transferred
  await prisma.assignment.create({
    data: {
      patientId: p3.id,
      wardId: wardMaternity.id,
      doctorId: doc3.id,
      status: 'transferred',
      assignedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      notes: '[seed] Transferred to specialist facility.',
    },
  });

  // Set ward occupancy to reflect only active assignments
  await prisma.ward.update({
    where: { id: wardGeneral.id },
    data: { currentOccupancy: 1 },
  });

  console.log('✅ Seed complete.');
  console.log(`   Wards: ${[wardGeneral, wardICU, wardMaternity, wardPediatric].length}`);
  console.log(`   Patients: 5`);
  console.log(`   Doctors: 4`);
  console.log(`   Assignments: 3 (1 active, 1 discharged, 1 transferred)`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
