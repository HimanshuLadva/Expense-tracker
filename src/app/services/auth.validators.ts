import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validator for password strength
 * Must contain: 1 uppercase, 1 lowercase, 1 digit, 1 special char, min 7 chars
 */
export function passwordStrengthValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const password = control.value;
    const errors: any = {};

    if (password.length < 7) {
      errors.minLength = true;
    }

    if (!/[A-Z]/.test(password)) {
      errors.uppercase = true;
    }

    if (!/[a-z]/.test(password)) {
      errors.lowercase = true;
    }

    if (!/[0-9]/.test(password)) {
      errors.digit = true;
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.specialChar = true;
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };
}

/**
 * Validator to check if passwords match
 */
export function passwordMatchValidator(passwordField: string, confirmPasswordField: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const password = control.get(passwordField);
    const confirmPassword = control.get(confirmPasswordField);

    if (!password || !confirmPassword) {
      return null;
    }

    if (confirmPassword.value === '') {
      return null;
    }

    if (password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ ...confirmPassword.errors, passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      // Remove passwordMismatch error if it exists
      if (confirmPassword.hasError('passwordMismatch')) {
        const errors = confirmPassword.errors;
        delete errors?.['passwordMismatch'];
        const hasErrors = errors && Object.keys(errors).length > 0;
        confirmPassword.setErrors(hasErrors ? errors : null);
      }
      return null;
    }
  };
}
