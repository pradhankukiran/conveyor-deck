import { useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { useStore } from '../lib/store'

const AUTO_DISMISS_MS = 3500

export function Toaster() {
  const toast = useStore((s) => s.toast)
  const dismissToast = useStore((s) => s.dismissToast)

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => {
      dismissToast()
    }, AUTO_DISMISS_MS)
    return () => window.clearTimeout(t)
  }, [toast, dismissToast])

  if (!toast) return null

  return (
    <div className="pointer-events-none absolute left-1/2 top-16 z-20 -translate-x-1/2">
      <div
        key={toast.id}
        className="pointer-events-auto flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900 shadow-lg shadow-amber-900/10"
      >
        <AlertTriangle className="size-4" />
        <span>{toast.message}</span>
        <button
          type="button"
          onClick={dismissToast}
          aria-label="Dismiss"
          className="ml-2 text-amber-700 hover:text-amber-900"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  )
}
