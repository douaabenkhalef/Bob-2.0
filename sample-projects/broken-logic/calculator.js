// Fixed: use === for comparison, || for OR
export function isAdult(age) {
  return age >= 18;
}

export function canDrive(hasLicense, hasPermit) {
  return hasLicense || hasPermit;
}
