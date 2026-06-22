// src/pages/Profile/ReaderIdentitySection/ViewMode/Tag.tsx

interface TagProps {
  children: React.ReactNode;
}

export function Tag({ children }: TagProps) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 14px',
        borderRadius: '20px',
        fontSize: '13px',
        fontWeight: '400',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        color: '#97A6BA',
      }}
    >
      {children}
    </span>
  );
}