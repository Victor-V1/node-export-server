export function numericValueRangeToString(r) {
  return `${r.lowerBound?.isExclusive ? '(' : '['}${r.lowerBound?.value} - ${r.upperBound?.value}${r.upperBound?.isExclusive ? ')' : ']'}`;
}

export function displayUser(user) {
  return user.fullName || user.email || user.username || 'unknown';
}
