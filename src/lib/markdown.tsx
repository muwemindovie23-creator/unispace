import { Fragment, type ReactNode } from 'react'

import { safeExternalUrl } from '@/lib/utils'

/**
 * A deliberately small Markdown subset for admin-authored legal and policy
 * text. It produces React elements rather than an HTML string, so there is no
 * `dangerouslySetInnerHTML` anywhere in UniSpace and raw HTML in the source is
 * rendered as plain text instead of being executed.
 *
 * Supported: headings (#..####), paragraphs, unordered and ordered lists,
 * blockquotes, horizontal rules, and inline **bold**, *italic*, `code` and
 * [links](https://example.org). Links must be http(s) or they render as text.
 */

type InlineToken =
  | { type: 'text'; value: string }
  | { type: 'bold'; value: string }
  | { type: 'italic'; value: string }
  | { type: 'code'; value: string }
  | { type: 'link'; value: string; href: string }

const INLINE_PATTERN =
  /(\*\*[^*]+\*\*)|(\*[^*]+\*)|(`[^`]+`)|(\[[^\]]+\]\([^)\s]+\))/g

function tokenizeInline(line: string): InlineToken[] {
  const tokens: InlineToken[] = []
  let lastIndex = 0

  for (const match of line.matchAll(INLINE_PATTERN)) {
    const index = match.index ?? 0
    if (index > lastIndex) {
      tokens.push({ type: 'text', value: line.slice(lastIndex, index) })
    }

    const raw = match[0]
    if (raw.startsWith('**')) {
      tokens.push({ type: 'bold', value: raw.slice(2, -2) })
    } else if (raw.startsWith('`')) {
      tokens.push({ type: 'code', value: raw.slice(1, -1) })
    } else if (raw.startsWith('[')) {
      const split = raw.indexOf('](')
      const text = raw.slice(1, split)
      const href = raw.slice(split + 2, -1)
      const safeHref = safeExternalUrl(href)
      if (safeHref) {
        tokens.push({ type: 'link', value: text, href: safeHref })
      } else if (href.startsWith('/')) {
        tokens.push({ type: 'link', value: text, href })
      } else {
        tokens.push({ type: 'text', value: text })
      }
    } else {
      tokens.push({ type: 'italic', value: raw.slice(1, -1) })
    }

    lastIndex = index + raw.length
  }

  if (lastIndex < line.length) tokens.push({ type: 'text', value: line.slice(lastIndex) })
  return tokens
}

function renderInline(line: string, keyPrefix: string): ReactNode {
  return tokenizeInline(line).map((token, index) => {
    const key = `${keyPrefix}-${index}`
    switch (token.type) {
      case 'bold':
        return <strong key={key}>{token.value}</strong>
      case 'italic':
        return <em key={key}>{token.value}</em>
      case 'code':
        return (
          <code key={key} className="rounded bg-surface-muted px-1.5 py-0.5 text-[0.9em]">
            {token.value}
          </code>
        )
      case 'link': {
        const isExternal = token.href.startsWith('http')
        return (
          <a
            key={key}
            href={token.href}
            className="font-semibold text-brand underline underline-offset-2"
            {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            {token.value}
          </a>
        )
      }
      default:
        return <Fragment key={key}>{token.value}</Fragment>
    }
  })
}

const HEADING_CLASSES: Record<number, string> = {
  1: 'mt-10 mb-4 text-3xl font-extrabold tracking-tight text-content',
  2: 'mt-9 mb-3 text-2xl font-bold tracking-tight text-content',
  3: 'mt-7 mb-2 text-lg font-bold text-content',
  4: 'mt-6 mb-2 text-base font-bold text-content',
}

export function Markdown({ source }: { source: string }) {
  const lines = source.replace(/\r\n/g, '\n').split('\n')
  const blocks: ReactNode[] = []

  let paragraph: string[] = []
  let list: { ordered: boolean; items: string[] } | null = null
  let quote: string[] = []

  const flushParagraph = () => {
    if (paragraph.length === 0) return
    const text = paragraph.join(' ')
    blocks.push(
      <p key={`p-${blocks.length}`} className="my-4 leading-relaxed text-content-muted">
        {renderInline(text, `p-${blocks.length}`)}
      </p>,
    )
    paragraph = []
  }

  const flushList = () => {
    if (!list) return
    const { ordered, items } = list
    const ListTag = ordered ? 'ol' : 'ul'
    blocks.push(
      <ListTag
        key={`l-${blocks.length}`}
        className={`my-4 space-y-2 pl-6 text-content-muted ${
          ordered ? 'list-decimal' : 'list-disc'
        }`}
      >
        {items.map((item, index) => (
          <li key={index} className="leading-relaxed">
            {renderInline(item, `l-${blocks.length}-${index}`)}
          </li>
        ))}
      </ListTag>,
    )
    list = null
  }

  const flushQuote = () => {
    if (quote.length === 0) return
    blocks.push(
      <blockquote
        key={`q-${blocks.length}`}
        className="my-5 border-l-4 border-brand bg-highlight/60 px-5 py-3 text-sm text-content"
      >
        {renderInline(quote.join(' '), `q-${blocks.length}`)}
      </blockquote>,
    )
    quote = []
  }

  const flushAll = () => {
    flushParagraph()
    flushList()
    flushQuote()
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()

    if (line.trim() === '') {
      flushAll()
      continue
    }

    const heading = /^(#{1,4})\s+(.*)$/.exec(line)
    if (heading) {
      flushAll()
      const level = heading[1].length
      const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4'
      blocks.push(
        <Tag key={`h-${blocks.length}`} className={HEADING_CLASSES[level]}>
          {renderInline(heading[2], `h-${blocks.length}`)}
        </Tag>,
      )
      continue
    }

    if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      flushAll()
      blocks.push(<hr key={`hr-${blocks.length}`} className="my-8 border-hairline" />)
      continue
    }

    const unordered = /^\s*[-*]\s+(.*)$/.exec(line)
    if (unordered) {
      flushParagraph()
      flushQuote()
      if (!list || list.ordered) {
        flushList()
        list = { ordered: false, items: [] }
      }
      list.items.push(unordered[1])
      continue
    }

    const ordered = /^\s*\d+[.)]\s+(.*)$/.exec(line)
    if (ordered) {
      flushParagraph()
      flushQuote()
      if (!list || !list.ordered) {
        flushList()
        list = { ordered: true, items: [] }
      }
      list.items.push(ordered[1])
      continue
    }

    const quoted = /^>\s?(.*)$/.exec(line)
    if (quoted) {
      flushParagraph()
      flushList()
      quote.push(quoted[1])
      continue
    }

    flushList()
    flushQuote()
    paragraph.push(line.trim())
  }

  flushAll()

  return <div className="text-[15px]">{blocks}</div>
}
