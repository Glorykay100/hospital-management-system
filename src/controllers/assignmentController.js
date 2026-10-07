// src/controllers/assignmentController.js
'use strict';

const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

/** Flatten a raw Prisma assignment into the API response shape */
function flattenAssignment(a) {
  return {
    id: a.id,
    patientId: a.patientId,
    patientName: a.patient?.fullName ?? null,
    wardId: a.wardId,
    wardName: a.ward?.name ?? null,
    doctorId: a.doctorId ?? null,
    doctorName: a.doctor?.fullName ?? null,
    status: a.status,
    assignedAt: a.assignedAt,
    dischargedAt: a.dischargedAt ?? null,
    notes: a.notes ?? null,
  };
}

const INCLUDE_ALL = {
  patient: true,
  ward: true,
  doctor: true,
};

// ── GET /api/assignments ───────────────────────────────────────────────────
async function listAssignments(req, res, next) {
  try {
    const { status } = req.query;
    const assignments = await prisma.assignment.findMany({
      where: status ? { status } : undefined,
      include: INCLUDE_ALL,
      orderBy: { assignedAt: 'desc' },
    });
    res.json({ success: true, data: assignments.map(flattenAssignment) });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/assignments/:id ───────────────────────────────────────────────
async function getAssignment(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: INCLUDE_ALL,
    });
    if (!assignment) throw new ApiError(404, `Assignment with id ${id} not found.`);
    res.json({ success: true, data: flattenAssignment(assignment) });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/assignments ──────────────────────────────────────────────────
// Fully transactional with row-level lock to prevent overbooking.
// Note: SELECT ... FOR UPDATE requires a direct (non-PgBouncer) connection.
// Render PostgreSQL direct connections support this fine.
async function createAssignment(req, res, next) {
  try {
    const { patientId, wardId, doctorId, notes } = req.body;

    const createdId = await prisma.$transaction(async (tx) => {
      // 1. Verify patient exists
      const patient = await tx.patient.findUnique({ where: { id: patientId } });
      if (!patient) throw new ApiError(400, `Patient with id ${patientId} not found.`);

      // 2. Lock the ward row to prevent race conditions on last bed
      const rows = await tx.$queryRaw`
        SELECT id, capacity, current_occupancy
        FROM wards
        WHERE id = ${wardId}
        FOR UPDATE
      `;
      const ward = rows[0];
      if (!ward) throw new ApiError(400, `Ward with id ${wardId} not found.`);
      if (ward.current_occupancy >= ward.capacity) {
        throw new ApiError(400, 'Ward is full. No beds are available.');
      }

      // 3. Verify doctor exists (if provided)
      if (doctorId) {
        const doctor = await tx.doctor.findUnique({ where: { id: doctorId } });
        if (!doctor) throw new ApiError(400, `Doctor with id ${doctorId} not found.`);
      }

      // 4. Create the assignment
      const assignment = await tx.assignment.create({
        data: {
          patientId,
          wardId,
          doctorId: doctorId || null,
          status: 'active',
          notes: notes || null,
        },
      });

      // 5. Increment ward occupancy
      await tx.ward.update({
        where: { id: wardId },
        data: { currentOccupancy: { increment: 1 } },
      });

      return assignment.id;
    });

    // Fetch the full joined record after the transaction
    const result = await prisma.assignment.findUnique({
      where: { id: createdId },
      include: INCLUDE_ALL,
    });

    res.status(201).json({ success: true, data: flattenAssignment(result) });
  } catch (err) {
    next(err);
  }
}

// ── PUT /api/assignments/:id ───────────────────────────────────────────────
// Handles discharge (status → 'discharged') and general updates.
async function updateAssignment(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const { status, doctorId, notes } = req.body;

    const updated = await prisma.$transaction(async (tx) => {
      const assignment = await tx.assignment.findUnique({ where: { id } });
      if (!assignment) throw new ApiError(404, `Assignment with id ${id} not found.`);

      if (status === 'discharged') {
        if (assignment.status === 'discharged') {
          throw new ApiError(400, 'Assignment is already discharged.');
        }

        const result = await tx.assignment.update({
          where: { id },
          data: {
            status: 'discharged',
            dischargedAt: new Date(),
            ...(doctorId !== undefined && { doctorId: doctorId || null }),
            ...(notes !== undefined && { notes: notes || null }),
          },
          include: INCLUDE_ALL,
        });

        // Decrement occupancy, clamped to 0
        if (assignment.status === 'active') {
          await tx.ward.update({
            where: { id: assignment.wardId },
            data: { currentOccupancy: { decrement: 1 } },
          });
          // Clamp: ensure currentOccupancy never goes negative
          await tx.$executeRaw`
            UPDATE wards
            SET current_occupancy = GREATEST(0, current_occupancy)
            WHERE id = ${assignment.wardId}
          `;
        }

        return result;
      }

      // Non-discharge update
      if (doctorId !== undefined && doctorId) {
        const doctor = await tx.doctor.findUnique({ where: { id: doctorId } });
        if (!doctor) throw new ApiError(400, `Doctor with id ${doctorId} not found.`);
      }

      return tx.assignment.update({
        where: { id },
        data: {
          ...(status !== undefined && { status }),
          ...(doctorId !== undefined && { doctorId: doctorId || null }),
          ...(notes !== undefined && { notes: notes || null }),
        },
        include: INCLUDE_ALL,
      });
    });

    res.json({ success: true, data: flattenAssignment(updated) });
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/assignments/:id ────────────────────────────────────────────
async function deleteAssignment(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);

    await prisma.$transaction(async (tx) => {
      const assignment = await tx.assignment.findUnique({ where: { id } });
      if (!assignment) throw new ApiError(404, `Assignment with id ${id} not found.`);

      // Only decrement if it was active (occupied a bed)
      if (assignment.status === 'active') {
        await tx.ward.update({
          where: { id: assignment.wardId },
          data: { currentOccupancy: { decrement: 1 } },
        });
        await tx.$executeRaw`
          UPDATE wards
          SET current_occupancy = GREATEST(0, current_occupancy)
          WHERE id = ${assignment.wardId}
        `;
      }

      await tx.assignment.delete({ where: { id } });
    });

    res.json({ success: true, message: 'Assignment deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listAssignments,
  getAssignment,
  createAssignment,
  updateAssignment,
  deleteAssignment,
};
