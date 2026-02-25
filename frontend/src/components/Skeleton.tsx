import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}) => (
  <div
    aria-hidden="true"
    style={{
      width,
      height,
      borderRadius,
      background: 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)',
      backgroundSize: '200% 100%',
      animation: 'skeleton-shimmer 1.4s ease infinite',
      ...style,
    }}
  />
);

export const LeaderboardSkeleton: React.FC = () => (
  <div style={{ padding: '0 12px' }}>
    {Array.from({ length: 8 }, (_, i) => (
      <div
        key={i}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '11px 8px',
        }}
      >
        <Skeleton width={24} height={16} borderRadius={4} />
        <Skeleton width={40} height={40} borderRadius="50%" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Skeleton width="60%" height={14} />
          <Skeleton width="30%" height={10} />
        </div>
        <Skeleton width={48} height={16} borderRadius={4} />
      </div>
    ))}
  </div>
);

export const PodiumSkeleton: React.FC = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      gap: 0,
      padding: '4px 16px 30px',
    }}
  >
    {[60, 76, 60].map((size, i) => (
      <div
        key={i}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: 110,
          marginBottom: i === 1 ? 16 : 0,
        }}
      >
        <Skeleton width={size} height={size} borderRadius="50%" style={{ opacity: 0.5 }} />
        <Skeleton width={60} height={12} borderRadius={4} style={{ marginTop: 8, opacity: 0.4 }} />
        <Skeleton width={40} height={10} borderRadius={4} style={{ marginTop: 4, opacity: 0.4 }} />
      </div>
    ))}
  </div>
);
