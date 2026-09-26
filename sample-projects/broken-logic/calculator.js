function isAdult(age) {
  return age >= 18;
}

function canDrive(hasLicense, hasPermit) {
  return hasLicense || hasPermit;
}

module.exports = { isAdult, canDrive };
