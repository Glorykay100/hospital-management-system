const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const pick = (b, keys) => Object.fromEntries(keys.filter(k => b[k] !== undefined).map(k => [k, b[k]]));
// Generic CRUD over Prisma; every handler try/catches into next(err).
module.exports = (model, label, fields, transform = x => x, orderBy = { id: 'asc' }) => {
  const m = () => prisma[model];
  const data = b => { const d = pick(b, fields); if (d.dateOfBirth) d.dateOfBirth = new Date(d.dateOfBirth); return d; };
  const w = fn => async (req, res, next) => { try { await fn(req, res); } catch (e) { next(e); } };
  const one = async id => { const r = await m().findUnique({ where: { id } }); if (!r) throw new ApiError(404, `${label} not found`); return r; };
  return {
    list: w(async (req, res) => res.json({ success: true, data: (await m().findMany({ orderBy })).map(transform) })),
    get: w(async (req, res) => res.json({ success: true, data: transform(await one(+req.params.id)) })),
    create: w(async (req, res) => {
      const d = data(req.body);
      if (model === 'ward') d.currentOccupancy = Math.min(d.currentOccupancy || 0, d.capacity);
      res.status(201).json({ success: true, data: transform(await m().create({ data: d })) });
    }),
    update: w(async (req, res) => {
      const cur = await one(+req.params.id), d = data(req.body);
      if (model === 'ward') {
        const cap = d.capacity ?? cur.capacity, occ = d.currentOccupancy ?? cur.currentOccupancy;
        if (occ > cap) throw new ApiError(400, 'Occupancy cannot exceed capacity');
      }
      res.json({ success: true, data: transform(await m().update({ where: { id: cur.id }, data: d })) });
    }),
    remove: w(async (req, res) => { await one(+req.params.id); await m().delete({ where: { id: +req.params.id } }); res.json({ success: true, message: `${label} deleted` }); }),
  };
};
