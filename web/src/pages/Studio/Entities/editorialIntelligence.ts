// Editorial Intelligence — Knowledge-entity rule graph.
// Turns a KnowledgeEntity into a structured EditorialReport using existing localized labels.

import type { KnowledgeEntity } from '../../../types/admin';
import type { EditorialReport, EditorialGroup } from '../../../components/Studio/editorialIntelligence/types';
import { deriveStatus, isEmpty } from '../../../components/Studio/editorialIntelligence/editorialState';

export interface EntityEditorialLabels {
  name: string;
  slug: string;
  type: string;
  description: string;
  status: string;
}

export function buildEntityReport(entity: KnowledgeEntity, l: EntityEditorialLabels): EditorialReport {
  const identity: EditorialGroup = {
    id: 'identity',
    steps: [
      { key: 'name', label: l.name, status: deriveStatus({ present: !isEmpty(entity.name) }), details: undefined },
      { key: 'slug', label: l.slug, status: deriveStatus({ present: !isEmpty(entity.slug) }), details: undefined },
      { key: 'type', label: l.type, status: deriveStatus({ present: !isEmpty(entity.node_type) }), details: undefined },
    ],
  };

  const content: EditorialGroup = {
    id: 'content',
    steps: [
      { key: 'description', label: l.description, status: deriveStatus({ present: !isEmpty(entity.description) }), details: undefined },
    ],
  };

  const quality: EditorialGroup = {
    id: 'quality',
    steps: [
      {
        key: 'status',
        label: l.status,
        status: entity.status === 'published' ? 'completed' : 'attention',
        details: undefined,
      },
    ],
  };

  return {
    entityTypeLabel: undefined,
    groups: [identity, content, quality],
  };
}