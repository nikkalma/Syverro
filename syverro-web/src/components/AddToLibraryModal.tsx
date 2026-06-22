// src/components/AddToLibraryModal.tsx
import { useState } from 'react';
import { statusLabels, statusOrder, UserBookStatus } from '../types/userBook';

interface AddToLibraryModalProps {
  isOpen: boolean;
  bookTitle: string;
  onClose: () => void;
  onAdd: (status: UserBookStatus) => void;
}

export default function AddToLibraryModal({
  isOpen,
  bookTitle,
  onClose,
  onAdd,
}: AddToLibraryModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<UserBookStatus>('planned');

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'rgba(18, 28, 36, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '32px',
          maxWidth: '400px',
          width: '100%',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: '20px', fontWeight: '400', color: '#E6EDF3', marginBottom: '8px' }}>
          Добавить в библиотеку
        </h2>
        <p style={{ color: '#97A6BA', fontSize: '14px', marginBottom: '20px' }}>
          «{bookTitle}»
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {statusOrder.map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              style={{
                padding: '10px 16px',
                background: selectedStatus === status ? 'rgba(91, 134, 161, 0.15)' : 'transparent',
                border: selectedStatus === status ? '1px solid #5B86A1' : '1px solid rgba(255,255,255,0.06)',
                borderRadius: '8px',
                color: selectedStatus === status ? '#E6EDF3' : '#97A6BA',
                fontSize: '14px',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                width: 'auto',
                transition: 'all 0.2s',
              }}
            >
              {statusLabels[status]}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button
            onClick={() => onAdd(selectedStatus)}
            style={{
              flex: 1,
              padding: '12px',
              background: '#5B86A1',
              border: 'none',
              borderRadius: '8px',
              color: '#0A1118',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Добавить
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '8px',
              color: '#97A6BA',
              fontSize: '14px',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}