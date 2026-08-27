export function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function textContainsQuery(text: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  return q ? text.toLowerCase().includes(q) : false;
}
