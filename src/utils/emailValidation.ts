export function validateEmail(email: string): boolean {
  // More comprehensive regex for email validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

export function getEmailErrorMessage(email: string): string | null {
  if (!email) {
    return "Email is required";
  }
  
  if (!validateEmail(email)) {
    return "Please enter a valid email address";
  }
  
  return null;
}
