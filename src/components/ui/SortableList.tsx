import { memo, useState, type ReactNode } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  type SortingStrategy,
} from '@dnd-kit/sortable'

type SortableId = string | number

interface SortableListProps<T> {
  items: T[]
  getId: (item: T) => SortableId
  enabled: boolean
  // Called with the dragged item's old and new index in `items`.
  onMove: (fromIndex: number, toIndex: number) => void
  renderItem: (item: T) => ReactNode
  // Items that stay in place but can still be dropped next to (e.g. headings).
  isFixed?: (item: T) => boolean
  // Element for each row; use 'li' inside a <ul>.
  as?: 'div' | 'li'
  rowClassName?: string
  rowId?: (item: T) => string
  handleLabel?: string
  // Lines the handle up with the row's first line of text.
  handleClassName?: string
}

// Rows stay put while dragging: a copy of the dragged row follows the pointer
// and a line marks where it will land. Shifting every row in between is too
// slow for long lists like a whole act of script.
const noShift: SortingStrategy = () => null

export function SortableList<T>({
  items,
  getId,
  enabled,
  onMove,
  renderItem,
  isFixed,
  as = 'div',
  rowClassName = 'bg-white',
  rowId,
  handleLabel = 'Drag to reorder',
  handleClassName = 'mt-3',
}: SortableListProps<T>) {
  const sensors = useSensors(
    // A small drag distance keeps plain clicks on the handle from starting a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const [activeId, setActiveId] = useState<SortableId | null>(null)

  if (!enabled) {
    const Row = as
    return (
      <>
        {items.map(item => (
          <Row key={getId(item)} id={rowId?.(item)} className={rowClassName}>
            {renderItem(item)}
          </Row>
        ))}
      </>
    )
  }

  const handleDragStart = ({ active }: DragStartEvent) => setActiveId(active.id)

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null)
    if (!over || active.id === over.id) return
    const from = items.findIndex(item => getId(item) === active.id)
    const to = items.findIndex(item => getId(item) === over.id)
    if (from >= 0 && to >= 0) onMove(from, to)
  }

  const activeItem = activeId == null ? undefined : items.find(item => getId(item) === activeId)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <SortableContext items={items.map(getId)} strategy={noShift}>
        {items.map(item => (
          <SortableRow
            key={getId(item)}
            id={getId(item)}
            as={as}
            className={rowClassName}
            domId={rowId?.(item)}
            fixed={isFixed?.(item) ?? false}
            handleLabel={handleLabel}
            handleClassName={handleClassName}
          >
            <RowContent item={item} renderItem={renderItem} />
          </SortableRow>
        ))}
      </SortableContext>
      <DragOverlay dropAnimation={null}>
        {activeItem !== undefined && (
          <div className={`flex items-start gap-2 shadow-lg ring-1 ring-gray-200 rounded opacity-95 ${rowClassName}`}>
            <span className={`${handleClassName} w-5 shrink-0 text-gray-700 cursor-grabbing select-none`}>⋮⋮</span>
            <div className="flex-1 min-w-0">{renderItem(activeItem)}</div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

// Every row re-renders whenever the pointer moves over a new row, so the row's
// content is memoised to keep that cheap.
const RowContent = memo(function RowContent<T>({
  item,
  renderItem,
}: {
  item: T
  renderItem: (item: T) => ReactNode
}) {
  return <>{renderItem(item)}</>
}) as <T>(props: { item: T; renderItem: (item: T) => ReactNode }) => ReactNode

function SortableRow({
  id,
  as: Row,
  className,
  domId,
  fixed,
  handleLabel,
  handleClassName,
  children,
}: {
  id: SortableId
  as: 'div' | 'li'
  className: string
  domId?: string
  fixed: boolean
  handleLabel: string
  handleClassName: string
  children: ReactNode
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging, index, activeIndex, overIndex } =
    useSortable({
      id,
      // Fixed rows can't be dragged but can still be dropped on.
      disabled: { draggable: fixed, droppable: false },
      animateLayoutChanges: () => false,
    })

  // Dropping here puts the item after this row when dragging down, before it
  // when dragging up.
  const isTarget = activeIndex >= 0 && overIndex === index && activeIndex !== index
  const indicator = isTarget ? (activeIndex < index ? 'after' : 'before') : null

  return (
    <Row
      ref={setNodeRef}
      id={domId}
      className={`relative flex items-start gap-2 ${isDragging ? 'opacity-40' : ''} ${className}`}
    >
      {indicator && (
        <span
          aria-hidden
          data-testid="drop-indicator"
          className={`pointer-events-none absolute inset-x-0 h-0.5 bg-blue-500 ${
            indicator === 'before' ? '-top-px' : '-bottom-px'
          }`}
        />
      )}
      {fixed ? (
        <span className="w-5 shrink-0" />
      ) : (
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={handleLabel}
          title={handleLabel}
          className={`${handleClassName} w-5 shrink-0 text-gray-400 hover:text-gray-700 cursor-grab active:cursor-grabbing touch-none select-none`}
        >
          ⋮⋮
        </button>
      )}
      <div className="flex-1 min-w-0">{children}</div>
    </Row>
  )
}
