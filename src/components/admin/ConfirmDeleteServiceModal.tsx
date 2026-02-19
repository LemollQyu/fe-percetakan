 "use client";

type Props = {
  open: boolean;
  serviceName: string;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
};

export default function ConfirmDeleteServiceModal({
  open,
  serviceName,
  onClose,
  onConfirm,
  loading = false,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-title"
      aria-describedby="confirm-delete-desc"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden border border-stone-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-4">
          <h2
            id="confirm-delete-title"
            className="font-barlow-bold text-lg font-bold text-stone-900"
          >
            Hapus Service
          </h2>
          <p
            id="confirm-delete-desc"
            className="font-monterat-tipis mt-2 text-[15px] text-stone-600 leading-relaxed"
          >
            Apakah yakin ingin menghapus service {serviceName}!
          </p>
        </div>
        <div className="bg-stone-100 border-t border-stone-200 px-5 py-2.5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="font-monterat-tipis min-h-[36px] px-4 py-1.5 rounded-xl text-sm font-semibold text-stone-600 hover:bg-stone-200/60 active:bg-stone-200 disabled:opacity-60 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="font-monterat-tipis min-h-[36px] px-4 py-1.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 active:bg-red-700 disabled:opacity-60 transition-colors"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Menghapus...
              </span>
            ) : (
              "Iya"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

