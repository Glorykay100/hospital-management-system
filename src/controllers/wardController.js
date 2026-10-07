// src/controllers/wardController.js
'use strict';

const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

/** Attach computed availableBeds to a ward object */
function withAvailableBeds(ward) {
  return { ...ward, availableBeds: ward.capacity - ward.currentOccupancy };
}

// ── GET /api/wards ─────────────────────────────────────────────────────────
async function listWards(req, res, next) {
  try {
    const wards = await prisma.ward.findMany({
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: wards.map(withAvailableBeds) });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/wards/:id ─────────────────────────────────────────────────────
async function getWard(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const ward = await prisma.ward.findUnique({
      where: { id },
      include: {
        assignments: {
          where: { status: 'active' },
          include: { patient: true, doctor: true },
          orderBy: { assignedAt: 'desc' },
        },
      },
    });
    if (!ward) throw new ApiError(404, `Ward with id ${id} not found.`);
    res.json({ success: true, data: withAvailableBeds(ward) });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/wards ────────────────────────────────────────────────────────
async function createWard(req, res, next) {
  try {
    const { name, wardType, capacity, currentOccupancy } = req.body;
    const occupancy = currentOccupancy !== undefined ? parseInt(currentOccupancy, 10) : 0;
    if (occupancy > parseInt(capacity, 10)) {
      throw new ApiError(400, 'Current occupancy cannot exceed capacity.');
    }
    const ward = await prisma.ward.create({
      data: { name, wardType, capacity: parseInt(capacity, 10), currentOccupancy: occupancy },
    });
    res.status(201).json({ success: true, data: withAvailableBeds(ward) });
  } catch (err) {
    next(err);
  }
}

// ── PUT /api/wards/:id ─────────────────────────────────────────────────────
async function updateWard(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await prisma.ward.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, `Ward with id ${id} not found.`);

    const { name, wardType, capacity, currentOccupancy } = req.body;
    const newCapacity = capacity !== undefined ? parseInt(capacity, 10) : existing.capacity;
    const newOccupancy =
      currentOccupancy !== undefined ? parseInt(currentOccupancy, 10) : existing.currentOccupancy;

    if (newOccupancy > newCapacity) {
      throw new ApiError(400, 'Current occupancy cannot exceed capacity.');
    }

    const ward = await prisma.ward.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(wardType !== undefined && { wardType }),
        ...(capacity !== undefined && { capacity: newCapacity }),
        ...(currentOccupancy !== undefined && { currentOccupancy: newOccupancy }),
      },
    });
    res.json({ success: true, data: withAvailableBeds(ward) });
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/wards/:id ──────────────────────────────────────────────────
async function deleteWard(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await prisma.ward.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, `Ward with id ${id} not found.`);

    // Prisma onDelete: Restrict on Assignment.ward prevents delete if active
    await prisma.ward.delete({ where: { id } });
    res.json({ success: true, message: 'Ward deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listWards, getWard, createWard, updateWard, deleteWard };
