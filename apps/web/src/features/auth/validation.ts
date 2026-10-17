export type FieldErrors<Field extends string> = Partial<Record<Field, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateEmail = (email: string) => {
  if (!email) return 'Email is required.';
  if (!EMAIL_PATTERN.test(email)) return 'Enter a valid email address.';
  return undefined;
};

export const validateRequired = (value: string, label: string) => {
  if (!value.trim()) return `${label} is required.`;
  return undefined;
};

export const validatePassword = (password: string) => {
  if (!password) return 'Password is required.';
  if (password.length < 8) return 'Password must be at least 8 characters.';
  return undefined;
};

export const validateDateOfBirth = (dateOfBirth: string) => {
  if (!dateOfBirth) return 'Date of birth is required.';

  const parsed = new Date(`${dateOfBirth}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== dateOfBirth) {
    return 'Enter a valid date of birth.';
  }

  if (dateOfBirth > new Date().toISOString().slice(0, 10)) {
    return 'Date of birth cannot be in the future.';
  }

  return undefined;
};

export const validateLoginFields = (email: string, password: string) => {
  const errors: FieldErrors<'email' | 'password'> = {};
  const emailError = validateEmail(email);
  const passwordError = validateRequired(password, 'Password');

  if (emailError) errors.email = emailError;
  if (passwordError) errors.password = passwordError;

  return errors;
};

export const validateRegisterFields = (
  firstName: string,
  lastName: string,
  email: string,
  dateOfBirth: string,
  password: string,
  confirmPassword: string
) => {
  const errors: FieldErrors<'firstName' | 'lastName' | 'email' | 'dateOfBirth' | 'password' | 'confirmPassword'> = {};
  const firstNameError = validateRequired(firstName, 'First name');
  const lastNameError = validateRequired(lastName, 'Last name');
  const emailError = validateEmail(email);
  const dateOfBirthError = validateDateOfBirth(dateOfBirth);
  const passwordError = validatePassword(password);

  if (firstNameError) errors.firstName = firstNameError;
  if (lastNameError) errors.lastName = lastNameError;
  if (emailError) errors.email = emailError;
  if (dateOfBirthError) errors.dateOfBirth = dateOfBirthError;
  if (passwordError) errors.password = passwordError;

  if (!confirmPassword) {
    errors.confirmPassword = 'Confirm your password.';
  } else if (!passwordError && password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return errors;
};

export const validateForgotPasswordFields = (email: string) => {
  const errors: FieldErrors<'email'> = {};
  const emailError = validateEmail(email);

  if (emailError) errors.email = emailError;

  return errors;
};

export const validateResetPasswordFields = (password: string, confirmPassword: string) => {
  const errors: FieldErrors<'password' | 'confirmPassword'> = {};
  const passwordError = validatePassword(password);

  if (passwordError) errors.password = passwordError;

  if (!confirmPassword) {
    errors.confirmPassword = 'Confirm your password.';
  } else if (!passwordError && password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return errors;
};

export const hasFieldErrors = <Field extends string>(errors: FieldErrors<Field>) =>
  Object.values(errors).some(Boolean);
