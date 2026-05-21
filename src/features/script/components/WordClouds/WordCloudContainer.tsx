import { useState } from 'react'
import WordCloudSelector from './WordCloudSelector'
import WordCloudPresenter from './WordCloudPresenter'
import type { PlayScript } from '../../types/script'
import type { WordCloudContextItem } from './types'

interface WordCloudContainerProps {
  play: PlayScript
}

export default function WordCloudContainer({ play }: WordCloudContainerProps) {
  const [context, setContext] = useState<WordCloudContextItem[] | undefined>()
  const [selectOpen, setSelectOpen] = useState(false)

  function contextOrganizer(
    content: WordCloudContextItem[],
    characters: WordCloudContextItem[]
  ) {
    setContext([...content, ...characters])
    setSelectOpen(false)
  }

  return (
    <div className="flex flex-col">
      {selectOpen || !context ? (
        <WordCloudSelector play={play} onFormSubmit={contextOrganizer} />
      ) : (
        <>
          <button
            onClick={() => setSelectOpen(true)}
            className="mb-4 px-3 py-1.5 border border-gray-300 text-sm rounded hover:bg-gray-50 self-start"
          >
            Select content to word cloud
          </button>
          <WordCloudPresenter context={context} play={play} />
        </>
      )}
    </div>
  )
}
