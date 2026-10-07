// src/controllers/doctorController.js
'use strict';

const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

// ── GET /api/doctors ───────────────────────────────────────────────────────
async function listDoctors(req, res, next) {
  try {
    const doctors = await prisma.doctor.findMany({
      orderBy: { fullName: 'asc' },
      include: {
        _count: { select: { assignments: { where: { status: 'active' } } } },
      },
    });
    res.json({ success: true, data: doctors });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/doctors/:id ───────────────────────────────────────────────────
async function getDoctor(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: {
        assignments: {
          include: { patient: true, ward: true },
          orderBy: { assignedAt: 'desc' },
        },
      },
    });
    if (!doctor) throw new ApiError(404, `Doctor with id ${id} not found.`);
    res.json({ success: true, data: doctor });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/doctors ──────────────────────────────────────────────────────
async function createDoctor(req, res, next) {
  try {
    const { fullName, specialization, email, phone } = req.body;
    const doctor = await prisma.doctor.create({
      data: {
        fullName,
        specialization,
        email: email || null,
        phone: phone || null,
      },
    });
    res.status(201).json({ success: true, data: doctor });
  } catch (err) {
    next(err);
  }
}

// ── PUT /api/doctors/:id ───────────────────────────────────────────────────
async function updateDoctor(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await prisma.doctor.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, `Doctor with id ${id} not found.`);

    const { fullName, specialization, email, phone } = req.body;
    const doctor = await prisma.doctor.update({
      where: { id },
      data: {
        ...(fullName !== undefined && { fullName }),
        ...(specialization !== undefined && { specialization }),
        ...(email !== undefined && { email: email || null }),
        ...(phone !== undefined && { phone: phone || null }),
      },
    });
    res.json({ success: true, data: doctor });
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/doctors/:id ────────────────────────────────────────────────
async function deleteDoctor(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await prisma.doctor.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, `Doctor with id ${id} not found.`);

    await prisma.doctor.delete({ where: { id } });
    res.json({ success: true, message: 'Doctor deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listDoctors, getDoctor, createDoctor, updateDoctor, deleteDoctor };
