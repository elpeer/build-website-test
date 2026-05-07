'use client';

import { useEffect, useState } from 'react';

export interface TocItem {
  id: string;
  label: string;
  emoji?: string;
}

interface Props { items: TocItem[]; }

/**
 * Floating in-page table of contents. Place inside a grid column or any
 * naturally-sized parent — the inner <nav> is the sticky element so the
 * usual "sticky doesn't work because the grid item stretches" gotcha
 * doesn't apply.
 */
export function FloatingToc({ items }: Props) {
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
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 },
    );

    for (const it of items) {
      const el = document.getElementById(it.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [items]);

  return (
    <aside aria-label="ניווט בעמוד" className="hidden xl:block">
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
