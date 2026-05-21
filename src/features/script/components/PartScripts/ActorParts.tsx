import { useState, useMemo } from 'react'
import {
  getFrenchScenesFromPlay,
  mergeTextFromFrenchScenes,
} from '../../../../utils/playScriptUtils'
import PartScriptTextContainer from './PartScriptTextContainer'
import { buildUserName, type User } from '../../../../utils/actorUtils'
import type { PlayScript } from '../../types/script'
import type { ActorWithJobs, PartText } from './types'

interface ActorPartsProps {
  actor: ActorWithJobs
  play: PlayScript
}

export default function ActorParts({ actor, play }: ActorPartsProps) {
  const [showCut, setShowCut] = useState(true)

  const characterIds = actor.jobs.map(j => j.character_id)

  const text = useMemo<PartText>(() => {
    const frenchScenes = getFrenchScenesFromPlay(
      play as Parameters<typeof getFrenchScenesFromPlay>[0]
    )
    return mergeTextFromFrenchScenes(frenchScenes) as unknown as PartText
  }, [play])

  return (
    <PartScriptTextContainer
      characterIds={characterIds}
      name={buildUserName(actor as User)}
      showCut={showCut}
      setShowCut={setShowCut}
      text={text}
    />
  )
}
