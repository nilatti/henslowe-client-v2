import { useState, useMemo } from "react";
import { useFreePlayStore } from "../store/freePlayStore";
import { SelectPlay } from "./SelectPlay";
import { LoadingSpinner } from "../../../components/ui";
import { WordCloudCanvas } from "../../../components/WordCloudCanvas";
import {
  getFrenchScenesFromPlay,
  getFrenchScenesFromAct,
  mergeTextFromFrenchScenes,
  getLinesForCharacter,
  returnWordsFromLines,
  getScenesFromPlay,
} from "../../../utils/playScriptUtils";
import type { PlayScript } from "../../script/types/script";
import { Suspense } from "react";
import { Trash2, RefreshCw } from "lucide-react";

interface WordEntry {
  text: string;
  value: number;
  include: boolean;
}

interface WordLines {
  originalContent: WordEntry[];
  newContent: WordEntry[];
}

interface ContextItem {
  type?: "play" | "act" | "scene" | "french_scene";
  id: number;
  label?: string;
  name?: string;
}

type UtilPlay = Parameters<typeof getFrenchScenesFromPlay>[0];
type UtilAct = Parameters<typeof getFrenchScenesFromAct>[0];

function getWordsForContext(
  item: ContextItem,
  play: PlayScript,
): WordLines {
  if (item.type === "play") {
    const frenchScenes = getFrenchScenesFromPlay(play as unknown as UtilPlay);
    const text = mergeTextFromFrenchScenes(frenchScenes);
    return returnWordsFromLines(
      text.lines as Parameters<typeof returnWordsFromLines>[0],
    ) as WordLines;
  } else if (item.type === "act") {
    const act = play.acts.find((a) => a.id === item.id);
    if (!act) return { originalContent: [], newContent: [] };
    const frenchScenes = getFrenchScenesFromAct(act as unknown as UtilAct);
    const text = mergeTextFromFrenchScenes(frenchScenes);
    return returnWordsFromLines(
      text.lines as Parameters<typeof returnWordsFromLines>[0],
    ) as WordLines;
  } else if (item.type === "scene") {
    const scenes = getScenesFromPlay(play as unknown as UtilPlay);
    const scene = scenes.find(
      (s) => (s as unknown as { id: number }).id === item.id,
    );
    if (!scene) return { originalContent: [], newContent: [] };
    const text = mergeTextFromFrenchScenes(scene.french_scenes);
    return returnWordsFromLines(
      text.lines as Parameters<typeof returnWordsFromLines>[0],
    ) as WordLines;
  } else if (item.type === "french_scene") {
    const scenes = getScenesFromPlay(play as unknown as UtilPlay);
    for (const scene of scenes) {
      const fs = (
        scene.french_scenes as unknown as Array<{
          id: number;
          lines: unknown[];
        }>
      ).find((f) => f.id === item.id);
      if (fs) {
        return returnWordsFromLines(
          fs.lines as Parameters<typeof returnWordsFromLines>[0],
        ) as WordLines;
      }
    }
    return { originalContent: [], newContent: [] };
  } else {
    const frenchScenes = getFrenchScenesFromPlay(play as unknown as UtilPlay);
    const text = mergeTextFromFrenchScenes(frenchScenes);
    const characterLines = getLinesForCharacter(
      text.lines as Parameters<typeof getLinesForCharacter>[0],
      item.id,
    );
    return returnWordsFromLines(
      characterLines as Parameters<typeof returnWordsFromLines>[0],
    ) as WordLines;
  }
}

function WordCountTable({
  wordList,
  onUpdate,
}: {
  wordList: WordEntry[];
  onUpdate: (list: WordEntry[]) => void;
}) {
  return (
    <div className="overflow-auto max-h-48 mt-2">
      <table className="text-xs border-collapse">
        <thead>
          <tr>
            <th className="border border-gray-300 p-1">+/−</th>
            <th className="border border-gray-300 p-1">word</th>
            <th className="border border-gray-300 p-1">count</th>
          </tr>
        </thead>
        <tbody>
          {wordList.map((word) => (
            <tr key={word.text}>
              <td className="border border-gray-300 p-1">
                {word.include ? (
                  <button
                    onClick={() =>
                      onUpdate(
                        wordList.map((w) =>
                          w === word ? { ...w, include: false } : w,
                        ),
                      )
                    }
                    className="text-gray-500 hover:text-red-500"
                    title="Remove word"
                  >
                    <Trash2 size={12} />
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      onUpdate(
                        wordList.map((w) =>
                          w === word ? { ...w, include: true } : w,
                        ),
                      )
                    }
                    className="text-gray-500 hover:text-green-600"
                    title="Restore word"
                  >
                    <RefreshCw size={12} />
                  </button>
                )}
              </td>
              <td
                className={`border border-gray-300 p-1 ${
                  word.include ? "" : "line-through text-red-500"
                }`}
              >
                {word.text}
              </td>
              <td
                className={`border border-gray-300 p-1 ${
                  word.include ? "" : "line-through text-red-500"
                }`}
              >
                {word.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CloudPane({
  title,
  words,
  onUpdate,
}: {
  title: string;
  words: WordEntry[];
  onUpdate: (list: WordEntry[]) => void;
}) {
  const visible = useMemo(
    () => words.filter((w) => w.include),
    [words],
  );
  return (
    <div className="flex flex-col items-center">
      <h4 className="text-sm font-medium text-gray-700 mb-2">{title}</h4>
      <WordCloudCanvas
        words={visible}
        width={480}
        height={340}
        onWordClick={(clicked) =>
          onUpdate(
            words.map((w) =>
              w.text === clicked.text ? { ...w, include: false } : w,
            ),
          )
        }
      />
      <WordCountTable wordList={words} onUpdate={onUpdate} />
    </div>
  );
}

function WordCloudPresenter({
  context,
  play,
}: {
  context: ContextItem[];
  play: PlayScript;
}) {
  const initialWords = useMemo(
    () =>
      context.map((item) => ({ item, words: getWordsForContext(item, play) })),
    [context, play],
  );

  const [wordState, setWordState] = useState<
    { item: ContextItem; words: WordLines }[]
  >(initialWords);

  function updateWords(
    index: number,
    key: "originalContent" | "newContent",
    list: WordEntry[],
  ) {
    setWordState((prev) =>
      prev.map((entry, i) =>
        i === index
          ? { ...entry, words: { ...entry.words, [key]: list } }
          : entry,
      ),
    );
  }

  return (
    <div className="space-y-10">
      {wordState.map((r, i) => (
        <div key={i} className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {r.item.label ?? r.item.name}
          </h3>
          <div className="flex flex-wrap gap-8">
            <CloudPane
              title="Original text"
              words={r.words.originalContent}
              onUpdate={(list) => updateWords(i, "originalContent", list)}
            />
            {r.words.newContent.some((w) => w.value > 0) && (
              <CloudPane
                title="Cut text"
                words={r.words.newContent}
                onUpdate={(list) => updateWords(i, "newContent", list)}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function WordCloudSelector({
  play,
  onSubmit,
}: {
  play: PlayScript;
  onSubmit: (items: ContextItem[]) => void;
}) {
  type AnyRecord = Record<string, unknown>;
  const acts = play.acts;
  const scenes = getScenesFromPlay(
    play as unknown as Parameters<typeof getScenesFromPlay>[0],
  ) as unknown as AnyRecord[];
  const frenchScenes = scenes.flatMap(
    (s) => (s.french_scenes as unknown as AnyRecord[]) ?? [],
  );

  const actItems = acts.map((a) => ({
    type: "act" as const,
    id: a.id,
    label: `Act ${a.number}`,
  }));
  const sceneItems = scenes.map((s) => ({
    type: "scene" as const,
    id: Number(s.id),
    label: String(s.pretty_name ?? ""),
  }));
  const fsItems = frenchScenes.map((fs) => ({
    type: "french_scene" as const,
    id: Number(fs.id),
    label: String(fs.pretty_name ?? ""),
  }));

  const [selectedContent, setSelectedContent] = useState<Set<string>>(
    new Set(),
  );
  const [selectedChars, setSelectedChars] = useState<Set<number>>(new Set());

  function toggleContent(key: string) {
    setSelectedContent((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleChar(id: number) {
    setSelectedChars((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSubmit() {
    const chosen: ContextItem[] = [];
    if (selectedContent.has("play")) {
      chosen.push({ type: "play", id: play.id, label: "Whole Play" });
    }
    [...actItems, ...sceneItems, ...fsItems].forEach((item) => {
      if (selectedContent.has(`${item.type}-${item.id}`)) chosen.push(item);
    });
    play.characters.forEach((c) => {
      if (selectedChars.has(c.id)) chosen.push({ id: c.id, name: c.name });
    });
    onSubmit(chosen);
  }

  const ready = selectedContent.size > 0 || selectedChars.size > 0;

  function CheckRow({
    keyStr,
    label,
  }: {
    keyStr: string;
    label: string;
  }) {
    return (
      <label className="flex items-center gap-1.5 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={selectedContent.has(keyStr)}
          onChange={() => toggleContent(keyStr)}
          className="rounded"
        />
        {label}
      </label>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          Select Characters (optional)
        </h3>
        <div className="flex flex-wrap gap-2">
          {play.characters.map((c) => (
            <label
              key={c.id}
              className="flex items-center gap-1.5 text-sm cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedChars.has(c.id)}
                onChange={() => toggleChar(c.id)}
                className="rounded"
              />
              {c.name}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">
          Select Content (optional)
        </h3>

        <div>
          <CheckRow keyStr="play" label="Whole Play" />
        </div>

        {actItems.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Acts
            </p>
            <div className="flex flex-wrap gap-2">
              {actItems.map((item) => (
                <CheckRow
                  key={`act-${item.id}`}
                  keyStr={`act-${item.id}`}
                  label={item.label}
                />
              ))}
            </div>
          </div>
        )}

        {sceneItems.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Scenes
            </p>
            <div className="flex flex-wrap gap-2">
              {sceneItems.map((item) => (
                <CheckRow
                  key={`scene-${item.id}`}
                  keyStr={`scene-${item.id}`}
                  label={item.label}
                />
              ))}
            </div>
          </div>
        )}

        {fsItems.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              French Scenes
            </p>
            <div className="flex flex-wrap gap-2">
              {fsItems.map((item) => (
                <CheckRow
                  key={`french_scene-${item.id}`}
                  keyStr={`french_scene-${item.id}`}
                  label={item.label}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        disabled={!ready}
        onClick={handleSubmit}
        className="px-4 py-2 bg-blue-600 text-white text-sm rounded disabled:opacity-50 hover:bg-blue-700"
      >
        {ready
          ? "Generate Word Clouds"
          : "Select at least one character or section"}
      </button>
    </div>
  );
}

export function WordCloud() {
  const { loading, play, setPlay } = useFreePlayStore();
  const [context, setContext] = useState<ContextItem[] | null>(null);
  const [selectOpen, setSelectOpen] = useState(false);

  if (!play?.id) {
    return (
      <Suspense fallback={<LoadingSpinner message="Loading plays…" />}>
        <SelectPlay />
      </Suspense>
    );
  }

  if (loading) {
    return <LoadingSpinner message="Loading play… this may take a moment" />;
  }

  return (
    <>
      <h2 className="text-xl font-semibold mb-3">
        Word Cloud for {play.title}
      </h2>
      <button
        onClick={() => setPlay(null)}
        className="mb-4 px-3 py-1.5 border border-gray-300 text-sm rounded hover:bg-gray-50"
      >
        Select a different play
      </button>

      {context && !selectOpen ? (
        <>
          <button
            onClick={() => setSelectOpen(true)}
            className="mb-4 px-3 py-1.5 border border-gray-300 text-sm rounded hover:bg-gray-50"
          >
            Select content to word cloud
          </button>
          <WordCloudPresenter context={context} play={play} />
        </>
      ) : (
        <WordCloudSelector
          play={play}
          onSubmit={(items) => {
            setContext(items);
            setSelectOpen(false);
          }}
        />
      )}
    </>
  );
}
