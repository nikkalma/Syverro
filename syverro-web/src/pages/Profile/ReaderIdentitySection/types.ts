// src/pages/Profile/ReaderIdentitySection/types.ts
import { ReaderProfile } from '../../../types/reader';
import { LocaleData } from '../../../locales';

export interface ReaderIdentitySectionProps {
  profile: ReaderProfile;
  onUpdate: (profile: ReaderProfile) => void;
  t: LocaleData;
}

export interface ViewModeProps {
  profile: ReaderProfile;
  t: LocaleData;
  onEdit: () => void;
}

export interface EditModeProps {
  profile: ReaderProfile;
  t: LocaleData;
  onSave: (profile: ReaderProfile) => void;
  onCancel: () => void;
}

export interface InfoItemProps {
  label: string;
  value: string | string[];
}