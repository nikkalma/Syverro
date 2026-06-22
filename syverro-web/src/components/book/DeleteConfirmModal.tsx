// src/components/book/DeleteConfirmModal.tsx

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteConfirmModal({
  isOpen,
  title,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#121C24] border border-[#2A4B60] rounded-2xl p-8 w-full max-w-md">
        <div className="text-center">
          <div className="text-6xl mb-4">🗑️</div>
          <h2 className="text-2xl font-light text-[#E6EDF3] mb-2">Удалить книгу?</h2>
          <p className="text-[#97A6BA] mb-6">
            Вы уверены, что хотите удалить книгу <strong className="text-[#E6EDF3]">"{title}"</strong>?
            <br />
            <span className="text-sm text-[#5B86A1]">Это действие нельзя отменить.</span>
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white font-medium transition"
          >
            🗑️ Удалить
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-[#2A4B60] hover:bg-[#3A5570] rounded-lg text-[#E6EDF3] transition"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}