'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import 'tippy.js/dist/tippy.css';
import { SlashCommands } from './slash-extension';
import { buildSlashItems } from './slash-items';
import { createClient } from '@/lib/supabase/client';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3, List, ListOrdered, Quote,
  Link as LinkIcon, Highlighter, Image as ImageIcon, Code, Undo2, Redo2,
} from 'lucide-react';

interface Props {
  initialHtml: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  /** Bucket to upload pasted images to. Defaults to 'guide-images'. */
  bucket?: string;
  /** Optional folder prefix inside the bucket (e.g. project_id). */
  pathPrefix?: string;
  className?: string;
}

export function RichTextEditor({
  initialHtml, onChange, placeholder, bucket = 'guide-images', pathPrefix, className,
}: Props) {
  const [uploading, setUploading] = useState(false);

  // Refs the slash-items can reach back into for late-bound callbacks
  // (pickImage / setLink need the live editor + supabase client, which
  // aren't ready when the items array is built).
  const pickImageRef = useRef<() => void>(() => {});
  const setLinkRef   = useRef<() => void>(() => {});

  const slashItems = useMemo(() => buildSlashItems({
    pickImage: () => pickImageRef.current(),
    setLink:   () => setLinkRef.current(),
  }), []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Highlight.configure({ multicolor: false }),
      Image.configure({
        HTMLAttributes: { class: 'rounded-md border border-border' },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank', class: 'text-brand underline' },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? "התחילו לכתוב... הקישו '/' להוספת בלוקים",
      }),
      SlashCommands.configure({ items: slashItems }),
    ],
    content: initialHtml,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] prose-img:rounded-md prose-a:text-brand',
        dir: 'rtl',
      },
      handlePaste(view, event) {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of items) {
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (file) {
              event.preventDefault();
              uploadAndInsert(file);
              return true;
            }
          }
        }
        return false;
      },
      handleDrop(view, event) {
        const files = event.dataTransfer?.files;
        if (!files?.length) return false;
        for (const f of Array.from(files)) {
          if (f.type.startsWith('image/')) {
            event.preventDefault();
            uploadAndInsert(f);
            return true;
          }
        }
        return false;
      },
    },
    onUpdate({ editor }) {
      onChange?.(editor.getHTML());
    },
    immediatelyRender: false, // SSR-safe
  });

  async function uploadAndInsert(file: File) {
    if (!editor) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const folder = pathPrefix ? `${pathPrefix}/` : '';
      const path = `${folder}${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, {
        contentType: file.type, upsert: false,
      });
      if (error) {
        console.error('image upload failed:', error.message);
        return;
      }
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      editor.chain().focus().setImage({ src: data.publicUrl }).run();
    } finally {
      setUploading(false);
    }
  }

  function pickImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = e => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (f) uploadAndInsert(f);
    };
    input.click();
  }
  pickImageRef.current = pickImage;

  function setLink() {
    if (!editor) return;
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('כתובת לינק', previous ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }
  setLinkRef.current = setLink;

  // Keep external content prop in sync if it changes from outside
  useEffect(() => {
    if (editor && initialHtml && editor.getHTML() !== initialHtml) {
      editor.commands.setContent(initialHtml, { emitUpdate: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  if (!editor) {
    return (
      <div className="min-h-[200px] rounded-md border border-border bg-muted/20 p-3 text-sm text-muted-fg">
        טוען עורך...
      </div>
    );
  }

  return (
    <div className={`rounded-md border border-border bg-background ${className ?? ''}`}>
      <Toolbar editor={editor} onPickImage={pickImage} onSetLink={setLink} uploading={uploading} />
      <div className="p-3">
        <EditorContent editor={editor} />
      </div>
      {uploading && (
        <p className="border-t border-border bg-muted/30 px-3 py-1.5 text-xs text-muted-fg">
          מעלה תמונה...
        </p>
      )}
    </div>
  );
}

function Toolbar({
  editor, onPickImage, onSetLink, uploading,
}: {
  editor: Editor;
  onPickImage: () => void;
  onSetLink: () => void;
  uploading: boolean;
}) {
  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/40 p-1.5 backdrop-blur">
      <ToolbarBtn editor={editor} cmd={['toggleHeading', { level: 1 }]} icon={Heading1} active={['heading', { level: 1 }]} title="כותרת 1" />
      <ToolbarBtn editor={editor} cmd={['toggleHeading', { level: 2 }]} icon={Heading2} active={['heading', { level: 2 }]} title="כותרת 2" />
      <ToolbarBtn editor={editor} cmd={['toggleHeading', { level: 3 }]} icon={Heading3} active={['heading', { level: 3 }]} title="כותרת 3" />
      <Sep />
      <ToolbarBtn editor={editor} cmd="toggleBold"      icon={Bold}          active="bold"      title="מודגש" />
      <ToolbarBtn editor={editor} cmd="toggleItalic"    icon={Italic}        active="italic"    title="נטוי" />
      <ToolbarBtn editor={editor} cmd="toggleUnderline" icon={UnderlineIcon} active="underline" title="קו תחתי" />
      <ToolbarBtn editor={editor} cmd="toggleStrike"    icon={Strikethrough} active="strike"    title="קו חוצה" />
      <ToolbarBtn editor={editor} cmd="toggleHighlight" icon={Highlighter}   active="highlight" title="הדגשה צבעונית" />
      <Sep />
      <ToolbarBtn editor={editor} cmd="toggleBulletList"  icon={List}        active="bulletList"  title="רשימה" />
      <ToolbarBtn editor={editor} cmd="toggleOrderedList" icon={ListOrdered} active="orderedList" title="רשימה ממוספרת" />
      <ToolbarBtn editor={editor} cmd="toggleBlockquote"  icon={Quote}       active="blockquote"  title="ציטוט" />
      <ToolbarBtn editor={editor} cmd="toggleCodeBlock"   icon={Code}        active="codeBlock"   title="קוד" />
      <Sep />
      <button type="button" onClick={onSetLink}
              className={`flex h-7 w-7 items-center justify-center rounded hover:bg-muted ${
                editor.isActive('link') ? 'bg-muted text-brand' : ''
              }`} title="לינק">
        <LinkIcon className="h-3.5 w-3.5" />
      </button>
      <button type="button" onClick={onPickImage} disabled={uploading}
              className="flex h-7 w-7 items-center justify-center rounded hover:bg-muted disabled:opacity-50"
              title="הוסף תמונה">
        <ImageIcon className="h-3.5 w-3.5" />
      </button>
      <Sep />
      <button type="button" onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="flex h-7 w-7 items-center justify-center rounded hover:bg-muted disabled:opacity-30"
              title="בטל">
        <Undo2 className="h-3.5 w-3.5" />
      </button>
      <button type="button" onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="flex h-7 w-7 items-center justify-center rounded hover:bg-muted disabled:opacity-30"
              title="חזור">
        <Redo2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function Sep() {
  return <span className="mx-1 h-5 w-px bg-border" />;
}

interface BtnProps {
  editor: Editor;
  cmd: string | [string, Record<string, unknown>];
  icon: React.ComponentType<{ className?: string }>;
  active?: string | [string, Record<string, unknown>];
  title?: string;
}

function ToolbarBtn({ editor, cmd, icon: Icon, active, title }: BtnProps) {
  const isActive = active
    ? Array.isArray(active) ? editor.isActive(active[0], active[1]) : editor.isActive(active)
    : false;
  function run() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chain = editor.chain().focus() as any;
    if (Array.isArray(cmd)) chain[cmd[0]](cmd[1]).run();
    else chain[cmd]().run();
  }
  return (
    <button type="button" onClick={run} title={title}
            className={`flex h-7 w-7 items-center justify-center rounded hover:bg-muted ${
              isActive ? 'bg-muted text-brand' : ''
            }`}>
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
