// Input validation. These run BEFORE the controller, so a malformed request
// is rejected with 400 and never reaches MongoDB.

// Helper: is this a real, non-empty piece of text?
function isFilledText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

// Used by POST /register and POST /login
function validateCredentials(req, res, next) {
  const { email, password } = req.body;
  const errors = [];

  if (!isFilledText(email)) {
    errors.push('email is required');
  } else if (!email.includes('@')) {
    errors.push('email must be a valid email address');
  }

  if (!isFilledText(password)) {
    errors.push('password is required');
  } else if (password.length < 6) {
    errors.push('password must be at least 6 characters');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: errors.join(', ') });
  }
  next();
}

// Used by POST /tasks
function validateTask(req, res, next) {
  const { title, description } = req.body;
  const errors = [];

  if (!isFilledText(title)) errors.push('title is required');
  if (!isFilledText(description)) errors.push('description is required');

  if (errors.length > 0) {
    return res.status(400).json({ message: errors.join(', ') });
  }
  next();
}

// Used by PUT /tasks/:id
function validateCompleted(req, res, next) {
  if (typeof req.body.completed !== 'boolean') {
    return res.status(400).json({ message: 'completed must be true or false' });
  }
  next();
}

module.exports = { validateCredentials, validateTask, validateCompleted };
