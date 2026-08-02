import { useState } from 'react';
import type { PersonalBookStatus } from '../../types/personalBook';
import { personalBookStatusOrder } from '../../types/personalBook';
import type { BookPageCopy } from './BookPageSections';

interface AddToLibraryModalProps {
  isOpen: boolean;
  bookTitle: string;
  copy: BookPageCopy;
  onClose: () => void;
  onAdd: (status: PersonalBookStatus) => void | Promise<void>;
}

export function AddToLibraryModal({ isOpen, bookTitle, copy, onClose, onAdd }: AddToLibraryModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<PersonalBookStatus>('planned');

  if (!isOpen) return null;

  return (
    <div className="book-page-modal" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <div className="book-page-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="book-page-modal-title">
        <h2 id="book-page-modal-title">{copy.modal.title}</h2>
        <p>{copy.modal.subtitle.replace('{title}', bookTitle)}</p>
        <label>
          {copy.modal.status}
          <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value as PersonalBookStatus)}>
            {personalBookStatusOrder.map((status) => <option key={status} value={status}>{copy.statuses[status]}</option>)}
          </select>
        </label>
        <div className="book-page-modal__actions">
          <button type="button" onClick={onClose}>{copy.modal.cancel}</button>
          <button type="button" onClick={() => void onAdd(selectedStatus)}>{copy.modal.add}</button>
        </div>
      </div>
    </div>
  );
}
