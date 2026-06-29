// src/pages/Profile/index.tsx
import { useLibrary } from '../../hooks/useLibrary';
import ProfileHeader from './ProfileHeader';
import ReaderIdentitySection from './ReaderIdentitySection';
import LibrarySection from './LibrarySection';

export default function Profile() {
  const { books, loading } = useLibrary();

  if (loading) {
    return (
      <div style={{ color: 'var(--text-secondary)', padding: '40px', textAlign: 'center' }}>
        Загрузка...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
      <ProfileHeader books={books} />
      <ReaderIdentitySection />
      <LibrarySection books={books} />
    </div>
  );
}