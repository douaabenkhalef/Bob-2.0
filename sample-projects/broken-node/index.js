export function pad(str, len) {
  const strValue = String(str);
  const length = parseInt(len, 10);
  
  if (isNaN(length)) {
    return strValue;
  }
  
  if (length <= strValue.length) {
    return strValue;
  }
  
  const padding = ' '.repeat(length - strValue.length);
  return padding + strValue;
}
