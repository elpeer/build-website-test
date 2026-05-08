'use client';

import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface SortableListProps<T extends { id: string }> {
  items: T[];
  onReorder: (orderedIds: string[]) => void;
  renderItem: (item: T, dragHandle: React.ReactNode) => React.ReactNode;
  /** Optional id prefix for SortableContext, useful when nesting. */
  contextId?: string;
}

/**
 * Vertical drag-and-drop list. Wraps each child with a draggable
 * <li>; the renderItem callback receives a "drag handle" node — the
 * user must include it somewhere visible (the rest of the row is *not*
 * draggable, so click events on edit/delete buttons keep working).
 */
export function SortableList<T extends { id: string }>({
  items, onReorder, renderItem, contextId,
}: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex(i => i.id === active.id);
    const newIndex = items.findIndex(i => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(items, oldIndex, newIndex);
    onReorder(next.map(i => i.id));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext id={contextId} items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-1.5">
          {items.map(item => (
            <SortableRow key={item.id} id={item.id}>
              {(handle) => renderItem(item, handle)}
            </SortableRow>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({
  id, children,
}: {
  id: string;
  children: (handle: React.ReactNode) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : undefined,
  };
  // Only the drag handle gets {attributes, listeners} so clicks on edit/
  // delete buttons elsewhere in the row don't trigger a drag. The <li>
  // owns the ref + transform style.
  const handle = (
    <button type="button"
            {...attributes} {...listeners}
            className="cursor-grab touch-none rounded p-1 text-muted-fg hover:bg-muted hover:text-brand active:cursor-grabbing"
            aria-label="גרור לשינוי סדר">
      <GripVertical className="h-4 w-4" />
    </button>
  );
  return (
    <li ref={setNodeRef} style={style}>
      {children(handle)}
    </li>
  );
}
