import { useMemo, useState } from "react";
import { LineRead } from "./LineRead";
import { LineEditable } from "./LineEditable";
import { useUpdateStageDirection, useUpdateSoundCue } from "../api/script";
import { sortScriptItems, isLineCut } from "../utils/scriptUtils";
import type { MergedText, ScriptLine } from "../types/script";

interface ScriptViewerProps {
  text: MergedText;
  showCut: boolean;
  linesPerMinute?: number | null;
  isEditable?: boolean;
  playId?: number;
  characters?: { id: number; name: string }[];
}

export function ScriptViewer({
  text,
  showCut,
  linesPerMinute,
  isEditable = false,
  playId,
  characters = [],
}: ScriptViewerProps) {
  const updateSd = useUpdateStageDirection(playId ?? 0);
  const updateSc = useUpdateSoundCue(playId ?? 0);

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

  let currentCharacterId: number | null = null;

  return (
    <div>
      {runTime !== null && (
        <div className="text-xs text-gray-500 mb-4 font-medium">
          Estimated run time at {linesPerMinute} lines/min: {runTime} minutes
        </div>
      )}
      <div className="font-mono text-sm leading-relaxed">
        {sortedItems.map((item) => {
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
          const showCharacter = !!(
            line.character_id && line.character_id !== currentCharacterId
          );
          if (line.character_id) currentCharacterId = line.character_id;

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
        })}
      </div>
    </div>
  );
}
