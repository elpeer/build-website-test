'use client';

import { useEffect, useImperativeHandle, useState, forwardRef } from 'react';
import type { SlashCommandItem } from './slash-items';

export interface SlashMenuRef {
  /** Called by the suggestion plugin on every keydown — return true if
   *  we handled it (prevents the editor from treating it as text). */
  onKeyDown: (event: KeyboardEvent) => boolean;
}

interface Props {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
}

/**
 * Notion-style command palette that pops up next to the cursor when the
 * user types '/'. Forwarded ref so the suggestion plugin can drive arrow
 * key navigation from outside the React tree (Tiptap renders us via
 * tippy.js in a portal).
 */
export const SlashMenu = forwardRef<SlashMenuRef, Props>(function SlashMenu(
  { items, command },
  ref,
) {
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    setSelected(0);
  }, [items]);

  useImperativeHandle(ref, () => ({
    onKeyDown(event) {
      if (event.key === 'ArrowUp') {
        setSelected(s => (s - 1 + items.length) % Math.max(items.length, 1));
        return true;
      }
      if (event.key === 'ArrowDown') {
        setSelected(s => (s + 1) % Math.max(items.length, 1));
        return true;
      }
      if (event.key === 'Enter') {
        const item = items[selected];
        if (item) command(item);
        return true;
      }
      return false;
    },
  }), [items, selected, command]);

  if (items.length === 0) {
    return (
      <div className="w-72 rounded-lg border border-border bg-background p-3 text-sm text-muted-fg shadow-lg">
        אין תוצאות.
      </div>
    );
  }

  return (
    <div className="max-h-80 w-80 overflow-y-auto rounded-lg border border-border bg-background p-1 shadow-lg"
         dir="rtl">
      {items.map((item, i) => {
        const Icon = item.icon;
        const active = i === selected;
        return (
          <button
            key={item.title}
            type="button"
            onMouseEnter={() => setSelected(i)}
            onClick={() => command(item)}
            className={`flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-start transition-colors ${
              active ? 'bg-brand/10 text-brand' : 'hover:bg-muted'
            }`}>
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-background ${
              active ? 'border-brand/30' : ''
            }`}>
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{item.title}</span>
              {item.description && (
                <span className="block truncate text-xs text-muted-fg">{item.description}</span>
              )}
            </span>
            {item.shortcut && (
              <code className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-fg">
                {item.shortcut}
              </code>
            )}
          </button>
        );
      })}
    </div>
  );
});
