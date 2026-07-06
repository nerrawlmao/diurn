/**
 * Entries written with the rich text editor are stored as a small HTML
 * subset. Everything is sanitized both before saving and before
 * rendering, so only known-safe formatting survives.
 */

const ALLOWED_TAGS = new Set([
  'B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'SPAN', 'DIV', 'P', 'BR', 'FONT',
])

// Tags whose content should be dropped entirely, not unwrapped.
const DROP_TAGS = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'LINK'])

const ALLOWED_STYLES = new Set([
  'color', 'font-size', 'font-weight', 'font-style', 'text-decoration',
  'text-decoration-line',
])

export function sanitizeEntryHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  sanitizeChildren(doc.body)
  // Drop zero-width spaces the editor uses as pending-style carriers.
  return doc.body.innerHTML.replace(/\u200B/g, '')
}

function sanitizeChildren(parent: Element) {
  for (const child of Array.from(parent.children)) {
    if (DROP_TAGS.has(child.tagName)) {
      child.remove()
      continue
    }

    sanitizeChildren(child)

    if (!ALLOWED_TAGS.has(child.tagName)) {
      // Unknown tag: keep its (already sanitized) content, drop the tag.
      child.replaceWith(...Array.from(child.childNodes))
      continue
    }

    for (const attr of Array.from(child.attributes)) {
      const keep =
        attr.name === 'style' ||
        (child.tagName === 'FONT' && attr.name === 'color')
      if (!keep) child.removeAttribute(attr.name)
    }

    if (child instanceof HTMLElement && child.hasAttribute('style')) {
      const style = child.style
      const kept: string[] = []
      for (let i = 0; i < style.length; i++) {
        const prop = style.item(i)
        if (ALLOWED_STYLES.has(prop)) {
          kept.push(`${prop}: ${style.getPropertyValue(prop)}`)
        }
      }
      if (kept.length > 0) {
        child.setAttribute('style', kept.join('; '))
      } else {
        child.removeAttribute('style')
      }
    }
  }
}

export function htmlToText(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return (doc.body.textContent ?? '').replace(/\u200B/g, '')
}

/** Entries sealed before the rich editor existed are plain text. */
export function looksLikeHtml(content: string): boolean {
  return /<[a-z][^>]*>/i.test(content)
}
