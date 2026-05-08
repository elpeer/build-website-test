'use client';

import { useEffect, useState } from 'react';

export interface TocItem {
  id: string;
  label: string;
  emoji?: string;
}

interface Props { items: TocItem[]; }

function useActive(items: TocItem[]) {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-120px 0px -60% 0px', threshold: 0 },
    );
    for (const it of items) {
      const el = document.getElementById(it.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [items]);
  return activeId;
}

/**
 * Horizontal scrollable chip bar — sticky under the topbar. Place at the top
 * of the content column. Visible only on <xl.
 */
export function FloatingTocMobile({ items }: Props) {
  const activeId = useActive(items);
  return (
    <nav aria-label="ניווט בעמוד"
         className="sticky top-16 z-20 -mx-4 mb-2 border-b border-border bg-background/95 backdrop-blur sm:-mx-6 lg:-mx-8 xl:hidden">
      <ul className="flex gap-1 overflow-x-auto whitespace-nowrap px-4 py-2 sm:px-6 lg:px-8">
        {items.map(item => {
          const active = activeId === item.id;
          return (
            <li key={item.id} className="shrink-0">
              <a href={`#${item.id}`}
                 className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm transition-colors ${
                   active
                     ? 'bg-brand text-white'
                     : 'bg-muted text-muted-fg hover:bg-muted/80'
                 }`}>
                {item.emoji && <span>{item.emoji}</span>}
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * Vertical sticky right rail. Place as the second grid column (xl+ only).
 */
export function FloatingToc({ items, className }: Props & { className?: string }) {
  const activeId = useActive(items);
  return (
    <aside aria-label="ניווט בעמוד" className={`hidden xl:block ${className ?? ''}`}>
      <nav className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto pe-2">
        <p className="mb-2 ps-3 text-xs font-semibold uppercase tracking-wider text-muted-fg">
          ניווט בעמוד
        </p>
        <ul className="space-y-1 border-s border-border ps-4">
          {items.map(item => {
            const active = activeId === item.id;
            return (
              <li key={item.id}>
                <a href={`#${item.id}`}
                   className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                     active
                       ? 'bg-brand/10 font-medium text-brand'
                       : 'text-muted-fg hover:bg-muted hover:text-foreground'
                   }`}>
                  {item.emoji && <span className="ms-1">{item.emoji}</span>}
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
