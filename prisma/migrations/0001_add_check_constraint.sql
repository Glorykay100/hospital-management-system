-- prisma/migrations/0001_add_check_constraint.sql
-- Run this MANUALLY after `npx prisma migrate dev --name init`
-- This adds a database-level CHECK constraint that Prisma does not support natively.

ALTER TABLE wards
  ADD CONSTRAINT occupancy_within_capacity
  CHECK (current_occupancy BETWEEN 0 AND capacity);
