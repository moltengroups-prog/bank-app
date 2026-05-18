// Request body validation middleware
// Sprint: Validation — wire in Joi or express-validator schemas here

export function validate(schema) {
  // TODO: validate req.body against the provided schema
  // TODO: return 400 with field-level errors on failure
  // TODO: call next() on success
  return (req, res, next) => {
    next();
  };
}
