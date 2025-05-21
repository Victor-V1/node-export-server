const metricRanges = [
  { divider: 1e18, suffix: 'E' },
  { divider: 1e15, suffix: 'P' },
  { divider: 1e12, suffix: 'T' },
  { divider: 1e9, suffix: 'G' },
  { divider: 1e6, suffix: 'M' },
  { divider: 1e3, suffix: 'K' }
];
export function suffixNumberMagnitude(value) {
  for (let i = 0; i < metricRanges.length; i++) {
    if (value >= metricRanges[i].divider) {
      return (
        (value / metricRanges[i].divider).toFixed(1).replace('.0', '') +
        metricRanges[i].suffix
      );
    }
  }
  return value.toString();
}
