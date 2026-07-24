export function formatAuthorName(
  name: string,
  firstName?: string | null,
  lastName?: string | null,
): string {
  if (firstName || lastName) {
    return [firstName, lastName].filter(Boolean).join(' ');
  }
  const idx = name.indexOf(',');
  if (idx > 0) {
    return name.substring(idx + 1).trim() + ' ' + name.substring(0, idx).trim();
  }
  return name;
}
