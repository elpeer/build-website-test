'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Pencil, Square, ArrowRight, Type as TypeIcon,
  Undo2, Redo2, Trash2, Save, X, Eraser,
} from 'lucide-react';

type Tool = 'pen' | 'rect' | 'arrow' | 'text';

type Stroke =
  | { type: 'pen'; points: [number, number][]; color: string; width: number }
  | { type: 'rect'; from: [number, number]; to: [number, number]; color: string; width: number }
  | { type: 'arrow'; from: [number, number]; to: [number, number]; color: string; width: number }
  | { type: 'text'; at: [number, number]; text: string; color: string; size: number };

const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#1f2937'];

interface Props {
  imageUrl: string;
  imageName: string;
  onSave: (blob: Blob, filename: string) => void | Promise<void>;
  onCancel: () => void;
}

/**
 * Full-screen modal for drawing on top of an image. Pen / rectangle /
 * arrow / text tools, color picker, undo/redo, clear. Pointer events so
 * mouse + touch work the same. On save: flattens image+strokes to PNG
 * and hands the blob to the parent.
 */
export function AnnotationCanvas({ imageUrl, imageName, onSave, onCancel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState<string>(COLORS[0]);
  const [width, setWidth] = useState<number>(4);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[]>([]);
  const [drawing, setDrawing] = useState<Stroke | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scale, setScale] = useState(1);

  // Load image once
  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { imgRef.current = img; setImgLoaded(true); };
    img.onerror = () => { console.error('image load failed'); };
    img.src = imageUrl;
  }, [imageUrl]);

  // Resize canvas to image natural size, but scale display to fit container
  useEffect(() => {
    if (!imgLoaded) return;
    const canvas = canvasRef.current;
    const img = imgRef.current;
    const cont = containerRef.current;
    if (!canvas || !img || !cont) return;
    canvas.width  = img.naturalWidth;
    canvas.height = img.naturalHeight;
    // Compute display scale to fit container
    const cw = cont.clientWidth, ch = cont.clientHeight;
    const s = Math.min(cw / img.naturalWidth, ch / img.naturalHeight, 1);
    setScale(s);
    redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgLoaded]);

  // Redraw on stroke change
  useEffect(() => { redraw(); }, [strokes, drawing]); // eslint-disable-line react-hooks/exhaustive-deps

  function redraw() {
    const canvas = canvasRef.current;
    const img    = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    const drawStroke = (s: Stroke) => {
      ctx.strokeStyle = s.type === 'text' ? s.color : (s as { color: string }).color;
      ctx.fillStyle   = s.type === 'text' ? s.color : (s as { color: string }).color;
      ctx.lineCap     = 'round';
      ctx.lineJoin    = 'round';
      ctx.lineWidth   = (s as { width?: number }).width ?? 4;

      if (s.type === 'pen' && s.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(s.points[0][0], s.points[0][1]);
        for (let i = 1; i < s.points.length; i++) ctx.lineTo(s.points[i][0], s.points[i][1]);
        ctx.stroke();
      } else if (s.type === 'rect') {
        const [x1, y1] = s.from, [x2, y2] = s.to;
        ctx.strokeRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
      } else if (s.type === 'arrow') {
        const [x1, y1] = s.from, [x2, y2] = s.to;
        ctx.beginPath();
        ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        // Arrowhead
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const head  = Math.max(s.width * 4, 14);
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - head * Math.cos(angle - Math.PI / 6), y2 - head * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(x2 - head * Math.cos(angle + Math.PI / 6), y2 - head * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
      } else if (s.type === 'text') {
        ctx.font = `bold ${s.size}px system-ui, sans-serif`;
        ctx.textBaseline = 'top';
        ctx.fillText(s.text, s.at[0], s.at[1]);
      }
    };

    for (const s of strokes) drawStroke(s);
    if (drawing) drawStroke(drawing);
  }

  function pointerToImage(e: React.PointerEvent<HTMLCanvasElement>): [number, number] {
    const canvas = canvasRef.current;
    if (!canvas) return [0, 0];
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width)  * canvas.width;
    const y = ((e.clientY - rect.top)  / rect.height) * canvas.height;
    return [x, y];
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const p = pointerToImage(e);
    if (tool === 'pen') {
      setDrawing({ type: 'pen', points: [p], color, width });
    } else if (tool === 'rect') {
      setDrawing({ type: 'rect', from: p, to: p, color, width });
    } else if (tool === 'arrow') {
      setDrawing({ type: 'arrow', from: p, to: p, color, width });
    } else if (tool === 'text') {
      const text = window.prompt('הקלד טקסט:');
      if (text?.trim()) {
        const s: Stroke = { type: 'text', at: p, text: text.trim(), color, size: 28 };
        setStrokes(prev => [...prev, s]);
        setRedoStack([]);
      }
    }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing) return;
    const p = pointerToImage(e);
    if (drawing.type === 'pen') {
      setDrawing({ ...drawing, points: [...drawing.points, p] });
    } else if (drawing.type === 'rect' || drawing.type === 'arrow') {
      setDrawing({ ...drawing, to: p });
    }
  }

  function handlePointerUp() {
    if (!drawing) return;
    if (
      (drawing.type === 'rect' || drawing.type === 'arrow') &&
      Math.hypot(drawing.to[0] - drawing.from[0], drawing.to[1] - drawing.from[1]) < 4
    ) {
      // Tiny stroke — discard
      setDrawing(null);
      return;
    }
    setStrokes(prev => [...prev, drawing]);
    setRedoStack([]);
    setDrawing(null);
  }

  function undo() {
    if (strokes.length === 0) return;
    setStrokes(prev => {
      const next = [...prev];
      const popped = next.pop();
      if (popped) setRedoStack(rs => [...rs, popped]);
      return next;
    });
  }
  function redo() {
    if (redoStack.length === 0) return;
    setRedoStack(rs => {
      const next = [...rs];
      const restored = next.pop();
      if (restored) setStrokes(s => [...s, restored]);
      return next;
    });
  }
  function clear() {
    if (strokes.length === 0) return;
    if (!window.confirm('למחוק את כל הסימונים?')) return;
    setStrokes([]); setRedoStack([]);
  }

  async function save() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSaving(true);
    try {
      const blob: Blob | null = await new Promise(r => canvas.toBlob(r, 'image/png', 0.92));
      if (!blob) { setSaving(false); return; }
      const ext = imageName.split('.').pop()?.toLowerCase() || 'png';
      const base = imageName.replace(/\.[^.]+$/, '');
      const filename = `${base}-מסומן.${ext === 'png' ? 'png' : 'png'}`;
      await onSave(blob, filename);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 text-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-black/80 p-3">
        <ToolButton active={tool === 'pen'}   onClick={() => setTool('pen')}   icon={<Pencil className="h-4 w-4" />}    label="עט" />
        <ToolButton active={tool === 'arrow'} onClick={() => setTool('arrow')} icon={<ArrowRight className="h-4 w-4" />} label="חץ" />
        <ToolButton active={tool === 'rect'}  onClick={() => setTool('rect')}  icon={<Square className="h-4 w-4" />}    label="ריבוע" />
        <ToolButton active={tool === 'text'}  onClick={() => setTool('text')}  icon={<TypeIcon className="h-4 w-4" />}  label="טקסט" />
        <span className="mx-1 h-6 w-px bg-white/20" />

        <div className="flex items-center gap-1.5">
          {COLORS.map(c => (
            <button key={c} type="button"
                    onClick={() => setColor(c)}
                    className={`h-7 w-7 rounded-full border-2 ${
                      color === c ? 'border-white scale-110' : 'border-white/30'
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={c} />
          ))}
        </div>

        <span className="mx-1 h-6 w-px bg-white/20" />

        <div className="flex items-center gap-1">
          <span className="text-xs text-white/60">עובי</span>
          {[2, 4, 8, 14].map(w => (
            <button key={w} type="button"
                    onClick={() => setWidth(w)}
                    className={`flex h-7 w-7 items-center justify-center rounded ${
                      width === w ? 'bg-white/20' : 'hover:bg-white/10'
                    }`}>
              <span className="rounded-full bg-white" style={{ width: w, height: w }} />
            </button>
          ))}
        </div>

        <span className="mx-1 h-6 w-px bg-white/20" />

        <ToolButton onClick={undo} disabled={strokes.length === 0}
                    icon={<Undo2 className="h-4 w-4" />} label="בטל" />
        <ToolButton onClick={redo} disabled={redoStack.length === 0}
                    icon={<Redo2 className="h-4 w-4" />} label="חזור" />
        <ToolButton onClick={clear} disabled={strokes.length === 0}
                    icon={<Eraser className="h-4 w-4" />} label="נקה" />

        <div className="ms-auto flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}
                  className="text-white hover:bg-white/10">
            <X className="ms-1 h-4 w-4" />
            ביטול
          </Button>
          <Button type="button" variant="accent" size="sm" onClick={save} disabled={saving}>
            <Save className="ms-1 h-4 w-4" />
            {saving ? 'שומר...' : 'שמור והוסף'}
          </Button>
        </div>
      </div>

      {/* Canvas surface */}
      <div ref={containerRef}
           className="relative flex flex-1 items-center justify-center overflow-auto p-4">
        {!imgLoaded ? (
          <p className="text-sm text-white/60">טוען תמונה...</p>
        ) : (
          <canvas
            ref={canvasRef}
            className="touch-none border border-white/20 shadow-2xl"
            style={{
              width: imgRef.current ? `${imgRef.current.naturalWidth * scale}px` : 'auto',
              height: imgRef.current ? `${imgRef.current.naturalHeight * scale}px` : 'auto',
              maxWidth: '100%', maxHeight: '100%',
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          />
        )}
      </div>
    </div>
  );
}

interface ToolButtonProps {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function ToolButton({ active, disabled, onClick, icon, label }: ToolButtonProps) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
            className={`flex items-center gap-1.5 rounded px-2 py-1 text-xs transition-colors ${
              active
                ? 'bg-white/20 text-white'
                : 'text-white/80 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent'
            }`}
            title={label}>
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
