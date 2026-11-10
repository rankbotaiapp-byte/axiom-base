import { useEffect, useRef, useState, type FormEvent } from 'react'
import { CYBER_STINGER, INTENT_COPY, type Intent } from './config'

type Status = 'idle' | 'sending' | 'sent' | 'error'

interface Props {
  intent: Intent | undefined
  onClose: () => void
}

/**
 * Lead-capture dialog driven by the route's `?intent=` search param,
 * so every CTA is deep-linkable (e.g. /security/cyber-stinger?intent=demo in an ad or email).
 * Uses native <dialog> for focus trapping, Esc-to-close and top-layer stacking.
 */
export function IntentDialog({ intent, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const abort = useRef<AbortController | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  // Only report a close back to the router when the user closed it (Esc / backdrop / button),
  // not when the URL or an unmount closed it — avoids phantom navigations.
  const intentRef = useRef(intent)
  intentRef.current = intent

  // Sync URL state -> dialog
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (intent && !d.open) {
      setStatus('idle')
      d.showModal()
    } else if (!intent && d.open) d.close()
  }, [intent])

  // Teardown: close the top-layer dialog and cancel any in-flight request
  useEffect(() => {
    const d = ref.current
    return () => {
      intentRef.current = undefined
      abort.current?.abort()
      if (d?.open) d.close()
    }
  }, [])

  const handleClose = () => {
    if (intentRef.current) onClose()
  }

  const copy = intent ? INTENT_COPY[intent] : INTENT_COPY.demo

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    abort.current?.abort()
    const ctl = new AbortController()
    abort.current = ctl
    setStatus('sending')
    try {
      const data = new FormData(e.currentTarget)
      data.set('intent', intent ?? 'demo')
      data.set('source', 'axiom/security/cyber-stinger')
      const res = await fetch(CYBER_STINGER.leadEndpoint, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
        signal: ctl.signal,
      })
      setStatus(res.ok ? 'sent' : 'error')
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setStatus('error')
    }
  }

  const field =
    'cs-mono w-full rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-[#00ffcc]/70 focus:shadow-[0_0_0_3px_rgba(0,255,204,0.15)]'

  return (
    <dialog
      ref={ref}
      onClose={handleClose}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
      aria-labelledby="cs-dialog-title"
      className="cs-dialog cs-root m-auto w-[min(100vw-2rem,34rem)] rounded-2xl border border-[#00ffcc]/25 bg-[#060b17]/95 p-0 text-white shadow-[0_0_80px_-20px_rgba(0,255,204,0.5)] backdrop-blur-md"
    >
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="cs-mono text-[11px] uppercase tracking-[0.25em] text-[#00ffcc]">Secure channel</p>
            <h2 id="cs-dialog-title" className="mt-1 text-2xl font-semibold">
              {copy.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="rounded-md p-2 text-white/50 transition hover:bg-white/5 hover:text-white"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-white/65">{copy.blurb}</p>

        {status === 'sent' ? (
          <div className="mt-6 rounded-lg border border-[#00ffcc]/30 bg-[#00ffcc]/5 p-5">
            <p className="font-semibold text-[#00ffcc]">Transmission received.</p>
            <p className="mt-1 text-sm text-white/70">Security operations will reply within one business day.</p>
            <button type="button" onClick={handleClose} className="cs-cta mt-4 rounded-md border border-[#00ffcc]/50 px-4 py-2 text-sm font-semibold text-[#00ffcc]">
              Back to the hub
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 grid gap-3 sm:grid-cols-2">
            <label className="sm:col-span-1">
              <span className="mb-1 block text-xs text-white/50">Name</span>
              <input name="name" required autoComplete="name" className={field} />
            </label>
            <label className="sm:col-span-1">
              <span className="mb-1 block text-xs text-white/50">Organization</span>
              <input name="organization" autoComplete="organization" className={field} />
            </label>
            <label className="sm:col-span-1">
              <span className="mb-1 block text-xs text-white/50">Email</span>
              <input name="email" type="email" required autoComplete="email" className={field} />
            </label>
            <label className="sm:col-span-1">
              <span className="mb-1 block text-xs text-white/50">Phone</span>
              <input name="phone" type="tel" autoComplete="tel" className={field} />
            </label>
            {intent !== 'contact' && (
              <label className="sm:col-span-2">
                <span className="mb-1 block text-xs text-white/50">Perimeter size</span>
                <select name="perimeter" defaultValue="" className={field}>
                  <option value="" disabled>
                    Select…
                  </option>
                  <option>Single building / under 2 acres</option>
                  <option>Campus / 2–20 acres</option>
                  <option>Industrial / 20–200 acres</option>
                  <option>Multi-site / 200+ acres</option>
                </select>
              </label>
            )}
            <label className="sm:col-span-2">
              <span className="mb-1 block text-xs text-white/50">Message</span>
              <textarea name="message" rows={3} className={field} />
            </label>

            {status === 'error' && (
              <p role="alert" className="text-sm text-[#ff3b5c] sm:col-span-2">
                Transmission failed. Check your connection and try again.
              </p>
            )}

            <button
              type="submit"
              disabled={status === 'sending'}
              className="cs-cta mt-2 rounded-md bg-[#00ffcc] px-5 py-3 font-semibold text-[#030712] disabled:opacity-60 sm:col-span-2"
            >
              {status === 'sending' ? 'Encrypting…' : copy.submit}
            </button>
          </form>
        )}
      </div>
    </dialog>
  )
}
