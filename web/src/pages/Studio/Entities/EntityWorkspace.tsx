import { getLocaleData, getBrowserLocale } from '../../../locales';
import { EntityWorkspaceProvider, useEntityWorkspace } from './EntityWorkspaceContext';
import EntityWorkspaceLayout from '../../../components/Studio/shared/EntityWorkspaceLayout';
import { entityTypeLabel } from './entityType';

export const SECTION_PATHS = ['overview', 'identity'] as const;

function WorkspaceContent() {
  const { entity, isNew, loading, error } = useEntityWorkspace();
  const t = getLocaleData(getBrowserLocale());

  const entityId = entity?.id;
  const activeSections = isNew
    ? [{ path: 'overview', label: (t.admin.workspace.sections as Record<string, string>).overview }]
    : SECTION_PATHS.map((p) => ({
        path: p,
        label: p === 'identity'
          ? t.admin.workspace.status
          : (t.admin.workspace.sections as Record<string, string>)[p],
      }));

  const name = isNew ? t.admin.entities.newEntity : (entity?.name || '');
  const statusLabel = entity?.status === 'published'
    ? t.admin.entities.statusPublished
    : t.admin.entities.statusDraft;
  const typeLabel = entity ? entityTypeLabel(entity.node_type) : t.admin.workspace.entityType;

  return (
    <EntityWorkspaceLayout
      name={name}
      entityTypeLabel={typeLabel}
      statusLabel={entity ? statusLabel : undefined}
      sapphireStatus={entity?.is_sapphire ? t.admin.workspace.sapphire : undefined}
      explorerVisible={entity?.explorer_visible}
      sections={activeSections}
      basePath={isNew ? '/studio/entities/new' : `/studio/entities/${entityId}`}
      loading={loading}
      error={error}
      notFoundLabel={t.admin.entities.title}
    />
  );
}

export default function EntityWorkspace() {
  return (
    <EntityWorkspaceProvider>
      <WorkspaceContent />
    </EntityWorkspaceProvider>
  );
}
