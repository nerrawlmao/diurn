import { useEffect } from 'react'

/**
 * Prevents the page behind a modal from scrolling while it is mounted.
 *
 * The page always shows a scrollbar (html { overflow-y: scroll }) so the
 * layout width never jumps as content height changes. On lock we hide that
 * scrollbar and add exactly its width as right padding on the body, so the
 * centered layout stays put (no sideways shift) and the backdrop can cover
 * the whole viewport with no bare gutter strip.
 */
export function useLockBodyScroll() {
  useEffect(() => {
    const root = document.documentElement
    const body = document.body
    const scrollBarWidth = window.innerWidth - root.clientWidth

    const prevOverflow = root.style.overflow
    const prevPadding = body.style.paddingRight

    root.style.overflow = 'hidden'
    if (scrollBarWidth > 0) {
      body.style.paddingRight = `${scrollBarWidth}px`
    }

    return () => {
      root.style.overflow = prevOverflow
      body.style.paddingRight = prevPadding
    }
  }, [])
}
