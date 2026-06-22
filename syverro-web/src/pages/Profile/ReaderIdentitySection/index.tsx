// src/pages/Profile/ReaderIdentitySection/index.tsx
import { useState } from 'react';
import { storageService } from '../../../services/storageService';
import { getLocaleData, getBrowserLocale } from '../../../locales';
import { ViewMode } from './ViewMode';
import { EditMode } from './EditMode';

export default function ReaderIdentitySection() {
  const locale = getBrowserLocale();
  const t = getLocaleData(locale);

  const [profile, setProfile] = useState(() => storageService.getReaderProfile());
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = (data: any) => {
    const updated = storageService.updateReaderProfile(data);
    setProfile(updated);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setProfile(storageService.getReaderProfile());
    setIsEditing(false);
  };

  if (isEditing) {
    return <EditMode profile={profile} t={t} onSave={handleSave} onCancel={handleCancel} />;
  }

  return <ViewMode profile={profile} t={t} onEdit={() => setIsEditing(true)} />;
}