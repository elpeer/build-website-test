import {
  Type, Heading1, Heading2, Heading3, List, ListOrdered, Quote,
  Code, Minus, Image as ImageIcon, Link as LinkIcon, Highlighter,
} from 'lucide-react';
import type { Editor, Range } from '@tiptap/core';

export interface SlashCommandItem {
  title: string;
  description?: string;
  /** Lowercase keywords for fuzzy filter (Hebrew + English). */
  keywords: string[];
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  /** What to do when picked. Receives the editor and the range of the typed
   *  '/foo' text so we can replace it before running the actual command. */
  command: (args: { editor: Editor; range: Range }) => void;
}

/**
 * The full slash-command palette for the guides rich-text editor. The
 * runtime pickImage callback is injected separately because it needs the
 * Supabase client + bucket configured at the editor level.
 */
export function buildSlashItems(opts: {
  pickImage: () => void;
  setLink:   () => void;
}): SlashCommandItem[] {
  return [
    {
      title: 'טקסט',
      description: 'פסקה רגילה',
      keywords: ['paragraph', 'text', 'p', 'טקסט', 'פסקה'],
      icon: Type,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setParagraph().run();
      },
    },
    {
      title: 'כותרת 1',
      description: 'הכותרת הגדולה ביותר',
      keywords: ['h1', 'heading', 'title', 'כותרת', 'כותרת ראשית'],
      icon: Heading1,
      shortcut: '#',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleHeading({ level: 1 }).run();
      },
    },
    {
      title: 'כותרת 2',
      description: 'תת-כותרת בולטת',
      keywords: ['h2', 'heading', 'subtitle', 'כותרת', 'תת-כותרת'],
      icon: Heading2,
      shortcut: '##',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleHeading({ level: 2 }).run();
      },
    },
    {
      title: 'כותרת 3',
      description: 'כותרת משנית',
      keywords: ['h3', 'heading', 'כותרת', 'תת-תת-כותרת'],
      icon: Heading3,
      shortcut: '###',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleHeading({ level: 3 }).run();
      },
    },
    {
      title: 'רשימה',
      description: 'רשימה עם תבליטים',
      keywords: ['bullet', 'list', 'ul', 'רשימה', 'תבליט'],
      icon: List,
      shortcut: '-',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run();
      },
    },
    {
      title: 'רשימה ממוספרת',
      description: 'רשימה עם מספרים',
      keywords: ['ordered', 'list', 'ol', 'numbered', 'מספור', 'רשימה'],
      icon: ListOrdered,
      shortcut: '1.',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run();
      },
    },
    {
      title: 'ציטוט',
      description: 'בלוק ציטוט מודגש',
      keywords: ['quote', 'blockquote', 'ציטוט'],
      icon: Quote,
      shortcut: '>',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBlockquote().run();
      },
    },
    {
      title: 'בלוק קוד',
      description: 'קוד עם רקע',
      keywords: ['code', 'pre', 'קוד'],
      icon: Code,
      shortcut: '```',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
      },
    },
    {
      title: 'קו מפריד',
      description: 'קו אופקי בין סקציות',
      keywords: ['divider', 'hr', 'separator', 'מפריד', 'קו'],
      icon: Minus,
      shortcut: '---',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setHorizontalRule().run();
      },
    },
    {
      title: 'הדגשה צבעונית',
      description: 'הדגשת טקסט נבחר',
      keywords: ['highlight', 'mark', 'הדגשה', 'צבע'],
      icon: Highlighter,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleHighlight().run();
      },
    },
    {
      title: 'תמונה',
      description: 'העלה תמונה מהמחשב',
      keywords: ['image', 'photo', 'picture', 'upload', 'תמונה'],
      icon: ImageIcon,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();
        opts.pickImage();
      },
    },
    {
      title: 'לינק',
      description: 'הוסף קישור על הטקסט הנבחר',
      keywords: ['link', 'url', 'href', 'לינק', 'קישור'],
      icon: LinkIcon,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();
        opts.setLink();
      },
    },
  ];
}

/** Fuzzy-ish filter: matches if any keyword starts-with or contains the
 *  query. Multi-token query (e.g. 'h 1') matches when each token hits. */
export function filterSlashItems(items: SlashCommandItem[], query: string): SlashCommandItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  const tokens = q.split(/\s+/);
  return items.filter(item => {
    const haystack = [item.title.toLowerCase(), ...item.keywords].join(' ');
    return tokens.every(tok => haystack.includes(tok));
  });
}
