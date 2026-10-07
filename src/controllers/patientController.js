// src/controllers/patientController.js
'use strict';

const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

// ── GET /api/patients ──────────────────────────────────────────────────────
async function listPatients(req, res, next) {
  try {
    const patients = await prisma.patient.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { assignments: true } },
      },
    });
    res.json({ success: true, data: patients });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/patients/:id ──────────────────────────────────────────────────
async function getPatient(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        assignments: {
          include: { ward: true, doctor: true },
          orderBy: { assignedAt: 'desc' },
        },
      },
    });
    if (!patient) throw new ApiError(404, `Patient with id ${id} not found.`);
    res.json({ success: true, data: patient });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/patients ─────────────────────────────────────────────────────
async function createPatient(req, res, next) {
  try {
    const { fullName, dateOfBirth, gender, phone, email, address } = req.body;
    const patient = await prisma.patient.create({
      data: {
        fullName,
        dateOfBirth: new Date(dateOfBirth),
        gender,
        phone: phone || null,
        email: email || null,
        address: address || null,
      },
    });
    res.status(201).json({ success: true, data: patient });
  } catch (err) {
    next(err);
  }
}

// ── PUT /api/patients/:id ──────────────────────────────────────────────────
async function updatePatient(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const { fullName, dateOfBirth, gender, phone, email, address } = req.body;

    const existing = await prisma.patient.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, `Patient with id ${id} not found.`);

    const patient = await prisma.patient.update({
      where: { id },
      data: {
        ...(fullName !== undefined && { fullName }),
        ...(dateOfBirth !== undefined && { dateOfBirth: new Date(dateOfBirth) }),
        ...(gender !== undefined && { gender }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(email !== undefined && { email: email || null }),
        ...(address !== undefined && { address: address || null }),
      },
    });
    res.json({ success: true, data: patient });
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/patients/:id ───────────────────────────────────────────────
async function deletePatient(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await prisma.patient.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, `Patient with id ${id} not found.`);

    await prisma.patient.delete({ where: { id } });
    res.json({ success: true, message: 'Patient deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listPatients, getPatient, createPatient, updatePatient, deletePatient };
