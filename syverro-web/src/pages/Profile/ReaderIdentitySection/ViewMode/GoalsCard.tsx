// src/pages/Profile/ReaderIdentitySection/ViewMode/GoalsCard.tsx
import { Tag } from './Tag';
import { readingGoalLabels } from '../../../../types/reader';
import { LocaleData } from '../../../../locales';

interface GoalsCardProps {
  profile: any;
  t: LocaleData;
}

export function GoalsCard({ profile, t }: GoalsCardProps) {
  if (!profile.readingGoals?.length) return null;

  return (
    <div
      style={{
        background: 'rgba(18, 28, 36, 0.6)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '20px',
      }}
    >
      <h3 style={{ fontSize: '13px', color: '#5B86A1', fontWeight: '500', marginBottom: '12px' }}>
        🎯 {t.readingGoals}
      </h3>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {profile.readingGoals.map((goal: string) => (
          <Tag key={goal}>
            {readingGoalLabels[goal as keyof typeof readingGoalLabels] || goal}
          </Tag>
        ))}
      </div>
    </div>
  );
}