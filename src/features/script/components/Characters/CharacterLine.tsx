import { LineRead } from '../LineRead'
import type { CharacterBreakdownLine } from '../../../plays/types/play'
import type { ScriptLine } from '../../types/script'

interface Props {
  line: CharacterBreakdownLine
  showCut: boolean
}

export function CharacterLine({ line, showCut }: Props) {
  return (
    <LineRead
      line={line as ScriptLine}
      showCharacter={false}
      showCut={showCut}
    />
  )
}
