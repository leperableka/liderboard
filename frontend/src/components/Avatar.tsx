import React from 'react';

interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: number;
  colorIndex?: number;
  /** Lazy-load the image (default: true). Pass false for above-the-fold avatars. */
  lazy?: boolean;
}

const GRADIENTS = [
  'linear-gradient(135deg, #667eea, #764ba2)',
  'linear-gradient(135deg, #f093fb, #f5576c)',
  'linear-gradient(135deg, #4facfe, #00f2fe)',
  'linear-gradient(135deg, #43e97b, #38f9d7)',
  'linear-gradient(135deg, #fa709a, #fee140)',
  'linear-gradient(135deg, #a18cd1, #fbc2eb)',
  'linear-gradient(135deg, #fccb90, #d57eeb)',
  'linear-gradient(135deg, #e0c3fc, #8ec5fc)',
  'linear-gradient(135deg, #f5576c, #ff6a00)',
  'linear-gradient(135deg, #667eea, #f093fb)',
  'linear-gradient(135deg, #c471f5, #fa71cd)',
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function getColorIndex(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % GRADIENTS.length;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  avatarUrl,
  size = 40,
  colorIndex,
  lazy = true,
}) => {
  const index = colorIndex ?? getColorIndex(name);
  const gradient = GRADIENTS[index % GRADIENTS.length];
  const fontSize = Math.round(size * 0.35);

  const style: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
    background: gradient,
  };

  if (avatarUrl) {
    return (
      <div style={style}>
        <img
          src={avatarUrl}
          alt={name}
          width={size}
          height={size}
          loading={lazy ? 'lazy' : 'eager'}
          decoding="async"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => {
            const target = e.currentTarget;
            target.style.display = 'none';
          }}
        />
      </div>
    );
  }

  return (
    <div style={style} aria-label={name} role="img">
      <span
        style={{
          fontSize,
          fontWeight: 700,
          color: '#fff',
          lineHeight: 1,
          textShadow: '0 1px 2px rgba(0,0,0,0.2)',
        }}
      >
        {getInitials(name)}
      </span>
    </div>
  );
};
