import { useEffect, useRef, useState, useSyncExternalStore } from 'react'

const RM_QUERY = '(prefers-reduced-motion: reduce)'

function subscribeRM(cb: () => void) {
  const mq = window.matchMedia(RM_QUERY)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}
export function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeRM,
    () => window.matchMedia(RM_QUERY).matches,
    () => false, // server snapshot
  )
}

interface Props {
  src: string
  poster: string
  portraitSrc?: string
  portraitPoster?: string
  portraitQuery?: string
}

/**
 * Full-bleed looping background video.
 *
 * - Poster is a real <picture> so SSR paints a frame before JS loads.
 * - The src is assigned imperatively (not as JSX <source>) so the effect can
 *   fully release the decoder on unmount and StrictMode's double-invoke is safe.
 * - Pauses in background tabs and for prefers-reduced-motion.
 */
export function BackgroundVideo({
  src,
  poster,
  portraitSrc,
  portraitPoster,
  portraitQuery = '(orientation: portrait) and (max-width: 900px)',
}: Props) {
  const ref = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    const v = ref.current
    if (!v) return

    // React does not reliably reflect `muted` as an attribute; iOS needs the property set before play().
    v.muted = true
    v.defaultMuted = true
    v.playsInline = true

    const mq = portraitSrc ? window.matchMedia(portraitQuery) : null
    const choose = () => (mq?.matches && portraitSrc ? portraitSrc : src)

    const play = () => {
      if (reduced || document.hidden) return
      v.play().catch(() => {
        /* autoplay refused (low-power mode etc.) — poster stays visible */
      })
    }
    const load = () => {
      const next = choose()
      if (v.getAttribute('src') === next) return
      setPlaying(false)
      v.setAttribute('src', next)
      v.load()
      play()
    }

    const onPlaying = () => setPlaying(true)
    const onVisibility = () => (document.hidden ? v.pause() : play())

    v.addEventListener('playing', onPlaying)
    document.addEventListener('visibilitychange', onVisibility)
    mq?.addEventListener('change', load)

    if (reduced) {
      v.pause()
      setPlaying(false)
    } else {
      load()
      play()
    }

    return () => {
      v.removeEventListener('playing', onPlaying)
      document.removeEventListener('visibilitychange', onVisibility)
      mq?.removeEventListener('change', load)
      // Release the media pipeline so nothing keeps buffering after navigation.
      v.pause()
      v.removeAttribute('src')
      v.load()
    }
  }, [src, portraitSrc, portraitQuery, reduced])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#030712]">
      <picture>
        {portraitPoster && <source media={portraitQuery} srcSet={portraitPoster} />}
        <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover" decoding="async" />
      </picture>

      <video
        ref={ref}
        muted
        loop
        playsInline
        autoPlay={!reduced}
        preload="auto"
        disablePictureInPicture
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
          playing ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Tactical vignette: flat #030712 @ 70% + darker edges so text never fights the footage */}
      <div className="absolute inset-0 bg-[#030712]/70" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(3,7,18,0.85)_100%)]" />
      <div className="cs-scanlines absolute inset-0" />
      {!reduced && <div className="cs-sweep absolute inset-x-0 h-40" />}
    </div>
  )
}
