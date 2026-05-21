import { useState, useMemo } from 'react'
import {
  getFrenchScenesFromPlay,
  mergeTextFromFrenchScenes,
} from '../../../../utils/playScriptUtils'
import PartScriptTextContainer from './PartScriptTextContainer'
import type { PlayScript } from '../../types/script'
import type { PartText } from './types'

interface CharacterPartsProps {
  character: { id: number; name: string }
  play: PlayScript
}

export default function CharacterParts({ character, play }: CharacterPartsProps) {
  const [showCut, setShowCut] = useState(true)

  const text = useMemo<PartText>(() => {
    const frenchScenes = getFrenchScenesFromPlay(
      play as Parameters<typeof getFrenchScenesFromPlay>[0]
    )
    return mergeTextFromFrenchScenes(frenchScenes) as unknown as PartText
  }, [play])

  return (
    <PartScriptTextContainer
      characterIds={[character.id]}
      name={character.name}
      showCut={showCut}
      setShowCut={setShowCut}
      text={text}
    />
  )
}
