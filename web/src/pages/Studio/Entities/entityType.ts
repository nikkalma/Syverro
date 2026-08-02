import { getLocaleData, getBrowserLocale } from '../../../locales';

export function entityTypeLabel(nodeType: string): string {
  const t = getLocaleData(getBrowserLocale());
  const labels = t.admin.entities.entityTypes as Record<string, string>;
  return labels[nodeType] || nodeType;
}
