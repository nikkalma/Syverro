import { useLocation } from 'react-router-dom';
import { Construction } from 'lucide-react';
import { getLocaleData, getBrowserLocale } from '../../../../../locales';
import EmptyWorkspace from '../../../../../components/Studio/shared/EmptyWorkspace';

export default function PlaceholderSection() {
  const t = getLocaleData(getBrowserLocale());
  const { pathname } = useLocation();
  const section = pathname.split('/').pop() || '';
  const label = (t.admin.workspace.sections as Record<string, string>)[section] || t.admin.workspace.comingSoon;

  return (
    <EmptyWorkspace
      icon={<Construction size={20} />}
      title={label}
      description={t.admin.workspace.comingSoon}
    />
  );
}
