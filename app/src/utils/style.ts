import type { AvatarTone, Priority, Status } from '../types';

export function statusClass(status: Status): string {
  switch (status) {
    case 'In review':
    case 'Working':
      return 'tag-accent';
    case 'Blocked':
      return 'tag-outline';
    default:
      return 'tag-neutral';
  }
}

export function priorityClass(priority: Priority): string {
  switch (priority) {
    case 'Critical':
      return 'tag-outline';
    case 'High':
      return 'tag-accent-2';
    default:
      return 'tag-neutral';
  }
}

const TAG_PALETTE = ['tag-accent', 'tag-accent-2', 'tag-neutral', 'tag-outline'];

/** Cycles by a value's position in its own option list, so any user-defined label column gets a distinct-ish, stable tag color without per-value config. */
export function tagPaletteClass(value: string, options: string[]): string {
  const i = options.indexOf(value);
  return TAG_PALETTE[(i < 0 ? 0 : i) % TAG_PALETTE.length];
}

export function avatarColors(tone: AvatarTone): { bg: string; fg: string } {
  switch (tone) {
    case 'accent':
      return { bg: 'var(--color-accent-800)', fg: 'var(--color-accent-100)' };
    case 'accent-2':
      return { bg: 'var(--color-accent-2-800)', fg: 'var(--color-accent-2-100)' };
    default:
      return { bg: 'var(--color-neutral-800)', fg: 'var(--color-neutral-100)' };
  }
}
