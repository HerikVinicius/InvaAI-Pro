const { error } = require('../utils/apiResponse');

/**
 * Checks that every key in `fields` exists and is non-empty in req.body.
 * Usage: validate(['username', 'password'])
 */
const validate = (fields) => (req, res, next) => {
  const missing = fields.filter(
    (f) => req.body[f] === undefined || req.body[f] === null || req.body[f] === ''
  );

  if (missing.length > 0) {
    return error(res, `Missing required fields: ${missing.join(', ')}.`, 400);
  }

  next();
};

module.exports = { validate };
