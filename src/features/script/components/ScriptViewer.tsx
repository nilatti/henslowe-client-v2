import { useMemo, useState } from "react";
import { LineRead } from "./LineRead";
import { LineEditable } from "./LineEditable";
import {
  useUpdateStageDirection,
  useUpdateSoundCue,
  useReorderScriptItems,
} from "../api/script";
import { sortScriptItems, isLineCut } from "../utils/scriptUtils";
import {
  buildScriptMove,
  buildScriptReorder,
  findItemByNumber,
  headerKey,
  itemKey,
  type ScriptRow,
} from "../utils/scriptReorder";
// Imported directly rather than from the ui barrel, which tests often mock.
import { SortableList } from "../../../components/ui/SortableList";
import { MoveItemForm } from "./MoveItemForm";
import type { MergedText, ScriptFrenchScene, ScriptLine } from "../types/script";

interface ScriptViewerProps {
  text: MergedText;
  // The French scenes `text` came from, in play order. Needed to drag items
  // between French scenes.
  frenchScenes?: ScriptFrenchScene[];
  // Every French scene in the play, in play order, so "Move…" can place an
  // item anywhere.
  allFrenchScenes?: ScriptFrenchScene[];
  // Dragging is too slow for the whole play, so it can be turned off.
  canDrag?: boolean;
  showCut: boolean;
  linesPerMinute?: number | null;
  isEditable?: boolean;
  playId?: number;
  characters?: { id: number; name: string }[];
}

export function ScriptViewer({
  text,
  frenchScenes = [],
  allFrenchScenes = [],
  canDrag = true,
  showCut,
  linesPerMinute,
  isEditable = false,
  playId,
  characters = [],
}: ScriptViewerProps) {
  const updateSd = useUpdateStageDirection(playId ?? 0);
  const updateSc = useUpdateSoundCue(playId ?? 0);
  const reorderItems = useReorderScriptItems(playId ?? 0);

  // Track which non-line item is being edited inline
  const [editingItem, setEditingItem] = useState<{
    id: number;
    type: "stage_direction" | "sound_cue";
    value: string;
  } | null>(null);

  // Optimistic display values — keyed by "${type}-${id}". Holds the submitted
  // value immediately so display doesn't flash back to original_content while
  // the async cache update (which awaits cancelQueries) catches up.
  const [displayValues, setDisplayValues] = useState<Record<string, string>>({});

  // The item whose "Move…" form is open, and the last move made, which is
  // confirmed because the item may move out of the loaded section.
  const [movingKey, setMovingKey] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<string | null>(null);

  const sortedItems = useMemo(() => {
    const all = [
      ...text.lines.map((l) => ({ ...l, _type: "line" as const })),
      ...text.stage_directions.map((sd) => ({
        ...sd,
        _type: "stage_direction" as const,
      })),
      ...text.sound_cues
        .filter((sc) => sc.original_content?.trim())
        .map((sc) => ({ ...sc, _type: "sound_cue" as const })),
    ].filter((item) => item.original_content?.trim());

    return sortScriptItems(all);
  }, [text]);

  // Dragging needs every row on screen, so it's off while cut text is hidden.
  const canReorder = canDrag && isEditable && !!playId && showCut && frenchScenes.length > 0;
  const canMove = isEditable && !!playId && allFrenchScenes.length > 0;
  const showHeaders = canReorder && frenchScenes.length > 1;

  // Draggable rows: the shown items, with a heading before each French scene
  // when there's more than one, so an item can be dropped at the top of any of them.
  const rows = useMemo((): ScriptRow[] => {
    const toRow = (item: (typeof sortedItems)[number]): ScriptRow => ({
      kind: "item",
      key: itemKey(item._type, item.id),
      type: item._type,
      id: item.id,
      frenchSceneId: item.french_scene_id,
    });
    if (!showHeaders) return sortedItems.map(toRow);
    return frenchScenes.flatMap((fs) => [
      { kind: "header" as const, key: headerKey(fs.id), frenchSceneId: fs.id },
      ...sortedItems.filter((item) => item.french_scene_id === fs.id).map(toRow),
    ]);
  }, [sortedItems, frenchScenes, showHeaders]);

  const lineCount = text.lines.filter(
    (l) => !isLineCut(l) && l.original_content?.trim(),
  ).length;

  const runTime =
    linesPerMinute && linesPerMinute > 0 && lineCount > 0
      ? Math.round(lineCount / linesPerMinute)
      : null;

  if (sortedItems.length === 0) {
    return (
      <div className="text-sm text-gray-400 italic p-4">No text selected.</div>
    );
  }

  const submitNonLineEdit = (
    id: number,
    type: "stage_direction" | "sound_cue",
    value: string,
    original: string,
  ) => {
    if (value !== original) {
      const key = `${type}-${id}`;
      setDisplayValues((prev) => ({ ...prev, [key]: value }));
      if (type === "stage_direction") {
        updateSd.mutate({ id, new_content: value });
      } else {
        updateSc.mutate({ id, new_content: value });
      }
    }
    setEditingItem(null);
  };

  // A line shows its speaker's name when the speaker changes, and at the top of
  // each French scene heading.
  const itemsByKey = new Map(sortedItems.map((item) => [itemKey(item._type, item.id), item]));
  const showCharacterByKey = new Map<string, boolean>();
  let speaker: number | null = null;
  for (const row of canReorder ? rows : sortedItems.map((i) => ({ kind: "item", key: itemKey(i._type, i.id) }))) {
    if (row.kind === "header") {
      speaker = null;
      continue;
    }
    const item = itemsByKey.get(row.key);
    if (item?._type !== "line" || !item.character_id) continue;
    showCharacterByKey.set(row.key, item.character_id !== speaker);
    speaker = item.character_id;
  }

  const moveItem = (
    item: (typeof sortedItems)[number],
    targetNumber: string,
    placement: "after" | "before",
  ): string | null => {
    const wanted = targetNumber.trim();
    if (!wanted) return "Enter a line number";
    const target = findItemByNumber(allFrenchScenes, wanted);
    if (!target) return `No line ${wanted} in this play`;
    if (target.type === item._type && target.id === item.id) return "Pick a different line";
    const orders = buildScriptMove(allFrenchScenes, { type: item._type, id: item.id }, target, placement);
    if (orders) reorderItems.mutate(orders);
    setMovingKey(null);
    setLastMove(`Moved ${item.number} ${placement} ${wanted}`);
    return null;
  };

  const renderItem = (item: (typeof sortedItems)[number]) => {
    const content = renderItemContent(item);
    if (!canMove || content === null) return content;
    const key = itemKey(item._type, item.id);
    return (
      <div key={key}>
        <div className="group flex items-start">
          <div className="flex-1 min-w-0">{content}</div>
          <button
            type="button"
            onClick={() => setMovingKey(movingKey === key ? null : key)}
            className="ml-2 mt-1 shrink-0 font-sans text-xs text-gray-400 opacity-0 hover:text-blue-600 focus:opacity-100 group-hover:opacity-100"
          >
            Move…
          </button>
        </div>
        {movingKey === key && (
          <MoveItemForm
            number={item.number ?? ""}
            onSubmit={(target, placement) => moveItem(item, target, placement)}
            onCancel={() => setMovingKey(null)}
          />
        )}
      </div>
    );
  };

  const renderItemContent = (item: (typeof sortedItems)[number]) => {
    if (item._type !== "line") {
      const isCut = isLineCut(item);
      if (isCut && !showCut) return null;

      const isEditing =
        editingItem?.id === item.id && editingItem.type === item._type;
      const localValue = displayValues[`${item._type}-${item.id}`];
      const displayContent = localValue !== undefined
        ? localValue
        : item.new_content?.trim()
        ? item.new_content
        : item.original_content;

      return (
        <div
          key={`${item._type}-${item.id}`}
          className={`flex gap-3 py-1 italic text-gray-500 text-sm ${
            isCut && showCut ? "opacity-40" : ""
          }`}
        >
          <span className="text-gray-400 w-16 shrink-0 text-right text-xs pt-0.5">
            {item.number}
          </span>
          <span className="w-40 shrink-0" />
          <span className="flex-1">
            {isEditing ? (
              <input
                autoFocus
                value={editingItem.value}
                onChange={(e) =>
                  setEditingItem((prev) =>
                    prev ? { ...prev, value: e.target.value } : prev,
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    submitNonLineEdit(
                      item.id,
                      item._type as "stage_direction" | "sound_cue",
                      editingItem.value,
                      item.original_content ?? "",
                    );
                  }
                  if (e.key === "Escape") setEditingItem(null);
                }}
                onBlur={() =>
                  submitNonLineEdit(
                    item.id,
                    item._type as "stage_direction" | "sound_cue",
                    editingItem.value,
                    item.original_content ?? "",
                  )
                }
                className="w-full px-2 py-0.5 border border-blue-400 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              />
            ) : (
              <span
                className={isEditable ? "cursor-text" : ""}
                onDoubleClick={
                  isEditable
                    ? () =>
                        setEditingItem({
                          id: item.id,
                          type: item._type as "stage_direction" | "sound_cue",
                          value: item.new_content?.trim()
                            ? item.new_content
                            : (item.original_content ?? ""),
                        })
                    : undefined
                }
                title={isEditable ? "Double-click to edit" : undefined}
              >
                {displayContent}
              </span>
            )}
          </span>
          {isEditable && (
            <div className="shrink-0">
              {isCut ? (
                <button
                  onClick={() => {
                    if (item._type === "stage_direction") {
                      updateSd.mutate({ id: item.id, new_content: null });
                    } else {
                      updateSc.mutate({ id: item.id, new_content: null });
                    }
                  }}
                  className="text-xs px-2 py-0.5 border border-cyan-500 text-cyan-600 rounded hover:bg-cyan-50"
                >
                  Un-Cut Whole Line
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (item._type === "stage_direction") {
                      updateSd.mutate({ id: item.id, new_content: "" });
                    } else {
                      updateSc.mutate({ id: item.id, new_content: "" });
                    }
                  }}
                  className="text-xs px-2 py-0.5 bg-cyan-500 text-white rounded hover:bg-cyan-600"
                >
                  Cut Whole Line
                </button>
              )}
            </div>
          )}
        </div>
      );
    }

    const line = item as ScriptLine & { _type: "line" };
    const showCharacter = showCharacterByKey.get(itemKey("line", line.id)) ?? false;

    if (isEditable && playId) {
      return (
        <LineEditable
          key={`line-${line.id}`}
          line={line}
          showCharacter={showCharacter}
          showCut={showCut}
          playId={playId}
          characters={characters}
        />
      );
    }

    return (
      <LineRead
        key={`line-${line.id}`}
        line={line}
        showCharacter={showCharacter}
        showCut={showCut}
      />
    );
  };

  const frenchSceneNames = new Map(frenchScenes.map((fs) => [fs.id, fs.pretty_name]));

  return (
    <div>
      {runTime !== null && (
        <div className="text-xs text-gray-500 mb-4 font-medium">
          Estimated run time at {linesPerMinute} lines/min: {runTime} minutes
        </div>
      )}
      {lastMove && (
        <div role="status" className="mb-3 flex items-center gap-3 text-xs text-green-700">
          {lastMove}
          <button type="button" onClick={() => setLastMove(null)} className="text-gray-400 hover:text-gray-600">
            Dismiss
          </button>
        </div>
      )}
      <div className="font-mono text-sm leading-relaxed">
        {canReorder ? (
          <SortableList
            items={rows}
            getId={(row) => row.key}
            enabled
            isFixed={(row) => row.kind === "header"}
            handleLabel="Drag to reorder"
            handleClassName="mt-1"
            onMove={(from, to) => {
              const orders = buildScriptReorder(frenchScenes, rows, from, to);
              if (orders) reorderItems.mutate(orders);
            }}
            renderItem={(row) => {
              if (row.kind === "header") {
                return (
                  <div className="mt-3 mb-1 py-1 border-b border-gray-200 font-sans text-xs font-semibold text-gray-500">
                    French Scene {frenchSceneNames.get(row.frenchSceneId)}
                  </div>
                );
              }
              const item = itemsByKey.get(row.key);
              return item ? renderItem(item) : null;
            }}
          />
        ) : (
          sortedItems.map(renderItem)
        )}
      </div>
    </div>
  );
}
