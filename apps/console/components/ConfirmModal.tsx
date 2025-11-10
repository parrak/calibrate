'use client'

export function ConfirmModal({
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-md rounded-lg bg-surface p-6 shadow-2xl border border-border">
        <h3 className="text-lg font-semibold text-fg mb-2">{title}</h3>
        <p className="text-sm text-mute mb-4">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-md border-2 border-border text-fg hover:bg-bg transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm rounded-md bg-danger text-white hover:bg-danger/90 transition-colors shadow-sm"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

