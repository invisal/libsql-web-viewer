export const formatNumber = (n: number | undefined) => {
  if (!n) return n;
  return new Intl.NumberFormat("en-US", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
};

export function convertTimeToMilliseconds(time: string) {
  const extension = time.charAt(time.length - 1);
  const value = time.substring(0, time.length-1);
  
  if(!isNaN(Number(value))) {
    switch(extension) {
      case 's':
        return Number(value) * 1000;
      case 'm':
        return (Number(value) * 60) * 1000;
      case 'h':
        return (Number(value) * 60 * 60) * 1000;
      case 'd':
        return ((Number(value) * 24) * 60 * 60) * 1000;
      default:
        return 0;
      }
  }
  return 0;
}