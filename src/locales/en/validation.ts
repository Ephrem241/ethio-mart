// Form validation and other short messages produced outside React's render
// (zod schemas, services). They are looked up when shown, via translate().
export const validation = {
  // Fallbacks for zod issues a schema didn't word itself.
  required: "This field is required.",
  invalid: "This value isn't valid.",
  tooShort: "Enter at least {min} characters.",
  tooLong: "Enter at most {max} characters.",
  tooSmall: "The value must be at least {min}.",
  tooBig: "The value must be at most {max}.",
  email: "Enter a valid email address.",
  phone: "Enter a valid Ethiopian phone number.",
}
