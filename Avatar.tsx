import type { AvatarTone } from '../../types';
import { avatarColors } from '../../utils/style';

export function Avatar({
  initials,
  tone = 'neutral',
  size = 24,
  ringed = false,
}: {
  initials: string;
  tone?: AvatarTone;
  size?: number;
  ringed?: boolean;
}) {
  const { bg, fg } = avatarColors(tone);
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg,
        color: fg,
        display: 'grid',
        placeItems: 'center',
        fontSize: Math.max(9, Math.round(size * 0.42)),
        flex: 'none',
        boxShadow: ringed ? '0 0 0 2px var(--color-bg)' : undefined,
      }}
    >
      {initials}
    </span>
  );
}
