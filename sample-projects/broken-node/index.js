export function pad(str, len) {
  const strValue = String(str);
  const length = Number(len);
  
  if (length <= strValue.length) {
    return strValue;
  }
  
  const padding = ' '.repeat(length - strValue.length);
  return padding + strValue;
}
