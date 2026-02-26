/**
 * Password must be at least 8 characters with at least one letter and one number.
 * Returns { valid: true } or { valid: false, message: string }.
 */
function validatePassword(password) {
  if (typeof password !== 'string') {
    return { valid: false, message: 'Password must be a string' };
  }
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  if (!hasLetter) {
    return { valid: false, message: 'Password must contain at least one letter' };
  }
  if (!hasNumber) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  return { valid: true };
}

module.exports = { validatePassword };
