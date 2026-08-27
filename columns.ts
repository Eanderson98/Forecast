/**
 * 1-based CSS grid column index for a key, given the live column order.
 * Column 1 is always the Task title, so every reorderable column starts at 2.
 */
export function colIndex(order: string[], key: string): number {
  const i = order.indexOf(key);
  return i === -1 ? 1 : i + 2;
}
