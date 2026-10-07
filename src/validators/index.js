const { body, param } = require('express-validator');
const id = param('id').isInt({ min: 1 }).withMessage('id must be an integer >= 1');
const optId = f => body(f).optional({ nullable: true }).isInt({ min: 1 }).withMessage(`${f} must be an integer >= 1`).toInt();
const opt = f => body(f).optional({ nullable: true });
const dob = body('dateOfBirth').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('dateOfBirth must be YYYY-MM-DD')
  .bail().custom(v => { if (new Date(v) > new Date()) throw new Error('dateOfBirth cannot be in the future'); return true; });
module.exports = {
  id,
  patient: [body('fullName').trim().notEmpty().withMessage('fullName is required'), dob,
    body('gender').isIn(['male', 'female', 'other']).withMessage('invalid gender'),
    opt('email').isEmail().withMessage('invalid email'), opt('phone').isLength({ max: 20 })],
  ward: [body('name').trim().notEmpty().withMessage('name is required'),
    body('wardType').isIn(['General', 'ICU', 'Maternity', 'Pediatric']).withMessage('invalid wardType'),
    body('capacity').isInt({ min: 1 }).withMessage('capacity must be > 0').toInt(),
    body('currentOccupancy').optional().isInt({ min: 0 }).withMessage('occupancy must be >= 0').toInt()],
  doctor: [body('fullName').trim().notEmpty().withMessage('fullName is required'),
    body('specialization').trim().notEmpty().withMessage('specialization is required'),
    opt('email').isEmail().withMessage('invalid email')],
  assignmentCreate: [body('patientId').isInt({ min: 1 }).withMessage('patientId must be an integer >= 1').toInt(),
    body('wardId').isInt({ min: 1 }).withMessage('wardId must be an integer >= 1').toInt(), optId('doctorId'), opt('notes').isString()],
  assignmentUpdate: [id, body('status').optional().isIn(['active', 'discharged', 'transferred']).withMessage('invalid status'), opt('notes').isString()],
};
