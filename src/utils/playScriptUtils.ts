import _ from "lodash";
import { syllable as Syllable } from "syllable";

interface Line {
  new_content?: string | null;
  original_content: string;
  count?: number;
  number?: string;
  character_id?: number | null;
  kind?: string | null;
}

interface OnStage {
  character_id: number;
}

interface FrenchScene {
  lines?: Line[];
  stage_directions?: Line[];
  sound_cues?: Line[];
  on_stages?: OnStage[];
  pretty_name?: string;
}

interface Scene {
  french_scenes: FrenchScene[];
  original_line_count?: number;
  new_line_count?: number;
}

interface Act {
  id?: number;
  original_line_count?: number;
  new_line_count?: number;
  scenes: Scene[];
  heading?: string;
}

interface Play {
  acts: Act[];
}

interface Character {
  lines?: Line[];
}

interface WordCountEntry {
  text: string;
  value: number;
  include: boolean;
}

interface TextCollection {
  lines: Line[];
  sound_cues: Line[];
  stage_directions: Line[];
}

interface SortWrapper {
  act_number: number | undefined;
  line: Line;
  line_number: number | undefined;
  scene_number: number | undefined;
}

function calculateLineCount(lines: Line[]): string {
  lines.map((line) => {
    line.count = 1;
    let syllablesPerLine: number;
    const defaultSyllables = 10;
    if (line.new_content && line.new_content.length > 0) {
      syllablesPerLine = Syllable(line.new_content);
    } else {
      syllablesPerLine = Syllable(line.original_content);
    }
    line.count = calculateChange(syllablesPerLine, defaultSyllables);
  });
  return _.sumBy(lines, "count").toFixed(2);
}

function calculateRunTime(lines: Line[], linesPerMinute: number): number {
  return Math.floor(Number(calculateLineCount(lines)) / linesPerMinute);
}

function calculateChange(a: number, b: number): number {
  return a / b;
}

function countWords(words: string[]): WordCountEntry[] {
  const countObj: Record<string, number> = {};
  words.forEach((word) => {
    if (word in countObj) {
      countObj[word]++;
    } else {
      countObj[word] = 1;
    }
  });

  let countArray: WordCountEntry[] = [];
  for (const [key, value] of Object.entries(countObj)) {
    countArray.push({ text: key, value: value, include: true });
  }
  countArray = _.orderBy(countArray, ["value"], ["desc"]);
  return countArray;
}

function determineTypeOfLine(line: Line): string {
  let type = "";
  if (
    line.kind?.match(/business|delivery|entrance|exit|mixed|modifier|location/)
  ) {
    type = "stage_direction";
  } else if (line.kind?.match(/flourish|music/)) {
    type = "sound_cue";
  } else {
    type = "line";
  }
  return type;
}

function filterEmptyActs(acts: Act[]): Act[] {
  return _.filter(acts, function (act) {
    if (act.original_line_count && act.original_line_count > 0 && act.new_line_count && act.new_line_count > 0) {
      console.log("act is not empty", act.id);
      return true;
    } else if (!act.original_line_count) {
      console.log("act is not empty", act.id);
      return true;
    }
    return false;
  });
}

function filterEmptyContent(content: Array<{ original_line_count?: number; new_line_count?: number }>): typeof content {
  return _.filter(content, function (contentItem) {
    if (contentItem.original_line_count && contentItem.original_line_count > 0 && contentItem.new_line_count && contentItem.new_line_count > 0) {
      return true;
    } else if (!contentItem.original_line_count) {
      return true;
    }
    return false;
  });
}

function filterEmptyScenes(scenes: Scene[]): Scene[] {
  return _.filter(scenes, function (scene) {
    if (scene.original_line_count && scene.original_line_count > 0 && scene.new_line_count && scene.new_line_count > 0) {
      return true;
    } else if (!scene.original_line_count) {
      return true;
    }
    return false;
  });
}

function getFrenchScenesFromAct(act: Act): FrenchScene[] {
  const frenchScenes: FrenchScene[][] = [];
  act.scenes.map((scene) => {
    frenchScenes.push(scene.french_scenes);
  });
  const flattened = _.flattenDeep(frenchScenes);
  return _.compact(flattened);
}

function getFrenchScenesFromPlay(play: Play): FrenchScene[] {
  const frenchScenes: FrenchScene[][] = [];
  play.acts.map((act) => {
    frenchScenes.push(getFrenchScenesFromAct(act));
  });
  const flattened = _.flattenDeep(frenchScenes);
  return _.compact(flattened);
}

function getScenesFromPlay(play: Play): Scene[] {
  const scenes: Scene[][] = [];
  play.acts.map((act) => scenes.push(act.scenes));
  const flattened = _.flattenDeep(scenes);
  return _.compact(flattened);
}

function getLinesForCharacter(text: Line[], characterId: number): Line[] {
  return text.filter((line) => line.character_id == characterId);
}

function getLinesFromCharacters(characters: Character[]): Line[] {
  const lines: Line[][] = [];
  characters.map((character) => {
    if (character.lines) {
      lines.push(character.lines);
    }
  });
  return _.flattenDeep(lines);
}

function getOnStagesFromAct(act: Act): OnStage[] {
  const onStages: OnStage[][] = [];
  const frenchScenes = getFrenchScenesFromAct(act);
  frenchScenes.map((frenchScene) => {
    onStages.push(frenchScene.on_stages ?? []);
  });
  const flat = _.flattenDeep(onStages);
  const compact = _.compact(flat);
  return _.uniqBy(compact, "character_id");
}

function getOnStagesFromScene(scene: Scene): OnStage[] {
  const onStages: OnStage[][] = [];
  const frenchScenes = scene.french_scenes;
  frenchScenes.map((frenchScene) => {
    onStages.push(frenchScene.on_stages ?? []);
  });
  const flat = _.flattenDeep(onStages);
  return _.uniqBy(flat, "character_id");
}

function letterValue(str: string): unknown {
  const anum: Partial<Record<string, number>> = {
    a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9, j: 10,
    k: 11, l: 12, m: 13, n: 14, o: 15, p: 16, q: 17, r: 18, s: 19, t: 20,
    u: 21, v: 22, w: 23, x: 24, y: 25, z: 26,
  };
  if (str.length === 1) return anum[str] ?? ' ';
  return str.split("").map((c) => letterValue(c));
}

function lineToWords(line: string): string[] {
  return line
    .replace(/[^\w\s]|_/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .split(" ");
}

function mergeTextFromFrenchScenes(frenchScenes: FrenchScene[]): TextCollection {
  const allText: TextCollection = {
    lines: [],
    sound_cues: [],
    stage_directions: [],
  };
  frenchScenes.map((frenchScene) => {
    const gatheredLines = frenchScene.lines;
    const compactLines = _.compact(gatheredLines);
    allText.lines = allText.lines.concat(compactLines);
    const compactStageDirections = _.compact(frenchScene.stage_directions);
    allText.stage_directions = allText.stage_directions.concat(compactStageDirections);
    const compactSoundCues = _.compact(frenchScene.sound_cues);
    allText.sound_cues = allText.sound_cues.concat(compactSoundCues);
  });

  return allText;
}

function returnWordsFromLines(lines: Line[]): {
  originalContent: WordCountEntry[];
  newContent: WordCountEntry[];
} {
  let newContentWords: string[][] = [];
  let originalContentWords: string[][] = [];
  lines.map((line) => {
    if (line.new_content) {
      if (!line.new_content.match(/^\s+$/)) {
        newContentWords.push(lineToWords(line.new_content));
      }
    } else {
      newContentWords.push(lineToWords(line.original_content));
    }
  });

  lines.map((line) => {
    originalContentWords.push(lineToWords(line.original_content));
  });

  const flatOriginal = _.flatten(originalContentWords);
  const flatNew = _.flatten(newContentWords);

  const originalContentWordCount = countWords(flatOriginal);
  const newContentWordCount = countWords(flatNew);
  return {
    originalContent: originalContentWordCount,
    newContent: newContentWordCount,
  };
}

function sortLines(arrayOfLines: Line[]): Line[] {
  const brokenOut: SortWrapper[] = arrayOfLines.map((line) => {
    let line_number: number | undefined;
    let act_number: number | undefined;
    let scene_number: number | undefined;
    if (line.number) {
      if (line.number.match(/EPI/)) {
        const number = line.number.replace("SD ", "");
        const number_pieces = number.split(".");
        act_number = 6;
        scene_number = 1;
        line_number = parseFloat(number_pieces[1] ?? '0');
      } else {
        const number = line.number.replace("SD ", "");
        const number_pieces = number.split(".");
        act_number = parseFloat(number_pieces[0] ?? '0');
        scene_number = parseFloat(number_pieces[1] ?? '0');
        if (number_pieces[2]?.match(/[a-zA-Z]/)) {
          const letter = number_pieces[2].match(/[a-z]/);
          const numPart = number_pieces[2].match(/[^a-z]/);
          const numString = `${String(numPart)}.${String(letter)}`;
          line_number = parseFloat(numString);
        } else {
          line_number = parseFloat(number_pieces[2] ?? '0');
        }
        if (typeof scene_number === "undefined") {
          console.log("undefined scene number", line);
        }
      }
    } else {
      console.log("line does not have number", line);
    }
    return {
      act_number: act_number,
      line: line,
      line_number: line_number,
      scene_number: scene_number,
    };
  });
  const sorted = _.sortBy(brokenOut, "act_number", "scene_number", "line_number");
  return sorted.map((item) => item.line);
}

// suppress unused function warnings for non-exported helpers
void letterValue;

// Cut-convention helpers.
// Cuts are stored as new_content === '' (empty string).
// null means the line has never been edited (unedited/original).
export const isCut = (line: Line): boolean => line.new_content === '';
export const isEdited = (line: Line): boolean =>
  line.new_content !== null && line.new_content !== '';
export const isUnedited = (line: Line): boolean => line.new_content === null;

export {
  calculateChange,
  calculateLineCount,
  calculateRunTime,
  determineTypeOfLine,
  filterEmptyActs,
  filterEmptyContent,
  filterEmptyScenes,
  getFrenchScenesFromAct,
  getFrenchScenesFromPlay,
  getLinesForCharacter,
  getLinesFromCharacters,
  getOnStagesFromAct,
  getOnStagesFromScene,
  getScenesFromPlay,
  mergeTextFromFrenchScenes,
  returnWordsFromLines,
  sortLines,
};
