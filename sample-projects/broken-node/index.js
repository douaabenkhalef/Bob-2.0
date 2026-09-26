export function pad(str, len) {
  const strValue = String(str);
  const length = parseInt(len, 10);
  
  if (isNaN(length) || length <= strValue.length) {
    return strValue;
  }
  
  const padding = ' '.repeat(length - strValue.length);
  return padding + strValue;
}
