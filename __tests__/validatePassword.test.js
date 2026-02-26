const { validatePassword } = require('../src/lib/validatePassword');

describe('validatePassword', () => {
  it('returns valid for password with 8+ chars, letter and number', () => {
    expect(validatePassword('password1')).toEqual({ valid: true });
    expect(validatePassword('Abcd1234')).toEqual({ valid: true });
  });

  it('returns invalid when not a string', () => {
    expect(validatePassword(123)).toEqual({ valid: false, message: 'Password must be a string' });
    expect(validatePassword(null)).toEqual({ valid: false, message: 'Password must be a string' });
  });

  it('returns invalid when shorter than 8 characters', () => {
    expect(validatePassword('short1')).toEqual({ valid: false, message: 'Password must be at least 8 characters' });
  });

  it('returns invalid when no letter', () => {
    expect(validatePassword('12345678')).toEqual({ valid: false, message: 'Password must contain at least one letter' });
  });

  it('returns invalid when no number', () => {
    expect(validatePassword('password')).toEqual({ valid: false, message: 'Password must contain at least one number' });
  });
});
