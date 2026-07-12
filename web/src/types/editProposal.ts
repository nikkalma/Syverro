import type { GlobalBook } from './globalBook';

export type EditProposalStatus =
  | 'pending'
  | 'approved'
  | 'rejected';

export interface EditProposal {
  id: string;

  bookId: string;

  userId: string;

  changedFields: Partial<GlobalBook>;

  reason?: string;

  status: EditProposalStatus;

  createdAt: number;

  reviewedAt?: number;

  moderatorId?: string;

  moderatorComment?: string;
}