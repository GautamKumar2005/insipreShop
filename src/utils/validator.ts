export function isEmail(email: string): boolean {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@(([^<>()[\]\\.,;:\s@"]+\.)+[^<>()[\]\\.,;:\s@"]{2,})$/i;
  return re.test(email);
}

export function isPhoneNumber(phone: string): boolean {
  const re = /^[0-9]{10,15}$/;
  return re.test(phone);
}

export function isNotEmpty(value: any): boolean {
  return value !== undefined && value !== null && value.toString().trim() !== "";
}
