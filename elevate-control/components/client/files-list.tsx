'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { recordFile, deleteFile } from '@/app/actions/client-workspace';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { Upload, FileText, Trash2, ExternalLink, AlertCircle, ImageIcon } from 'lucide-react';

export interface ProjectFileRow {
  id: string;
  filename: string;
  storage_path: string;
  file_url: string;
  mime_type: string | null;
  size_bytes: number | null;
  notes: string | null;
  created_at: string;
}

interface Props {
  projectId: string;
  projectSlug: string;
  workspace: string;
  category?: string | null;       // optional sub-bucket within the workspace
  files: ProjectFileRow[];
  isStudio: boolean;
  /** When false and !isStudio, hide the upload button (read-only client view). */
  clientCanUpload?: boolean;
  /** When false and !isStudio, hide the delete button. */
  clientCanDelete?: boolean;
  /** Title shown above the list (so we can have multiple FilesList per workspace). */
  title?: string;
  emptyText?: string;
}

const ACCEPT = 'image/*,application/pdf,.zip,.doc,.docx,.xls,.xlsx,.txt,.csv';
const MAX_BYTES = 50 * 1024 * 1024;

function formatSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

export function FilesList({
  projectId, projectSlug, workspace, category,
  files, isStudio,
  clientCanUpload = true,
  clientCanDelete = false,
  title, emptyText,
}: Props) {
  const canUpload = isStudio || clientCanUpload;
  const canDelete = isStudio || clientCanDelete;
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const visibleFiles = query.trim()
    ? files.filter(f => f.filename.toLowerCase().includes(query.trim().toLowerCase()))
    : files;
  const [, startTransition] = useTransition();

  async function handleFiles(list: FileList | null) {
    if (!list?.length) return;
    setError(null);
    setUploading(true);
    try {
      const supabase = createClient();
      for (const file of Array.from(list)) {
        if (file.size > MAX_BYTES) {
          setError(`${file.name}: גדול מ-50MB`); continue;
        }
        const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
        const path = `${projectId}/files/${workspace}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('client-files').upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) { setError(`${file.name}: ${upErr.message}`); continue; }

        const result = await recordFile({
          projectId, projectSlug, workspace,
          category: category ?? null,
          filename: file.name,
          storagePath: path,
          mimeType: file.type,
          sizeBytes: file.size,
        });
        if (!result.ok) {
          setError(`${file.name}: ${result.error}`);
          await supabase.storage.from('client-files').remove([path]);
        }
      }
      if (inputRef.current) inputRef.current.value = '';
      router.refresh();
    } finally {
      setUploading(false);
    }
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`למחוק את ${name}?`)) return;
    startTransition(async () => {
      await deleteFile(id, { projectSlug, workspace });
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-fg">
          {title ?? `${files.length} קבצים`}
        </h3>
        {canUpload && (
          <>
            <Button type="button" variant="outline" size="sm"
                    onClick={() => inputRef.current?.click()}
                    disabled={uploading}>
              <Upload className="ms-1 h-3.5 w-3.5" />
              {uploading ? 'מעלה...' : 'העלאה'}
            </Button>
            <input ref={inputRef} type="file" multiple accept={ACCEPT}
                   className="hidden"
                   onChange={e => handleFiles(e.target.files)} />
          </>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{error}</span>
        </div>
      )}

      {files.length > 6 && (
        <SearchInput value={query} onChange={setQuery}
                     placeholder={`חיפוש בקבצים... (${files.length})`} />
      )}

      {files.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-fg">
          {emptyText ?? (canUpload ? 'אין קבצים עדיין. לחצו על העלאה.' : 'עדיין לא הועלו קבצים.')}
        </div>
      ) : visibleFiles.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-fg">
          לא נמצאו קבצים תואמים.
        </div>
      ) : (
        <ul className="space-y-2">
          {visibleFiles.map(f => {
            const isImage = f.mime_type?.startsWith('image/');
            return (
              <li key={f.id} className="flex items-center gap-3 rounded-md border border-border bg-background p-3">
                {isImage ? (
                  <a href={f.file_url} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.file_url} alt={f.filename}
                         className="h-12 w-12 rounded object-cover" />
                  </a>
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded bg-muted">
                    {isImage ? <ImageIcon className="h-5 w-5 text-muted-fg" /> : <FileText className="h-5 w-5 text-muted-fg" />}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{f.filename}</p>
                  <p className="text-xs text-muted-fg">
                    {formatSize(f.size_bytes)} · {new Date(f.created_at).toLocaleDateString('he-IL')}
                  </p>
                </div>
                <a href={f.file_url} target="_blank" rel="noopener noreferrer"
                   className="text-brand hover:underline" aria-label="פתח">
                  <ExternalLink className="h-4 w-4" />
                </a>
                {canDelete && (
                  <button type="button" onClick={() => handleDelete(f.id, f.filename)}
                          className="text-red-600 hover:text-red-700" aria-label="מחק">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
