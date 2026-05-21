// Word cloud rendering uses react-wordcloud (installed with --legacy-peer-deps).
import { useEffect, useState } from 'react'
import ReactWordcloud from 'react-wordcloud'
import WordCount from './WordCount'
import type { WordCloudContextItem, WordEntry, WordLines } from './types'
import type { PlayScript } from '../../types/script'

const wordcloudOptions = {
  fontSizes: [20, 100] as [number, number],
}

interface ComparisonContainerProps {
  context: { item: WordCloudContextItem; lines: WordLines }
  play: PlayScript
}

export default function ComparisonContainer({ context, play }: ComparisonContainerProps) {
  const [words, setWords] = useState<WordLines>(context.lines)
  const [includedOriginalWords, setIncludedOriginalWords] = useState<WordEntry[]>([])
  const [includedNewWords, setIncludedNewWords] = useState<WordEntry[]>([])

  useEffect(() => {
    setIncludedOriginalWords(words.originalContent.filter(w => w.include))
  }, [JSON.stringify(words.originalContent)])

  useEffect(() => {
    setIncludedNewWords(words.newContent.filter(w => w.include))
  }, [JSON.stringify(words.newContent)])

  function updateWords(newList: WordEntry[], key: 'originalContent' | 'newContent') {
    setWords(prev => ({ ...prev, [key]: newList }))
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!words.originalContent) {
    return <div>Loading words</div>
  }

  const label = context.item.label ?? context.item.name ?? ''

  return (
    <div className="border-t-2 border-gray-200 flex flex-col mt-9">
      <h2 className="text-xl font-semibold text-center" id={label}>
        {label}
      </h2>
      <button
        onClick={scrollToTop}
        className="self-center mb-4 px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
      >
        Back to top
      </button>
      <div className="flex flex-row flex-nowrap gap-6">
        <div className="flex flex-col items-center">
          <h3 className="text-base font-semibold mb-2">Original text</h3>
          <div className="max-h-[700px] w-[500px]">
            <ReactWordcloud
              options={wordcloudOptions}
              words={includedOriginalWords}
            />
          </div>
          <WordCount
            list="originalContent"
            updateWordList={updateWords}
            wordList={words.originalContent}
          />
        </div>

        {!play.canonical && (
          <div className="flex flex-col items-center">
            <h3 className="text-base font-semibold mb-2">Cut text</h3>
            <div className="max-h-[700px] w-[500px]">
              <ReactWordcloud
                options={wordcloudOptions}
                words={includedNewWords}
              />
            </div>
            <WordCount
              list="newContent"
              updateWordList={updateWords}
              wordList={words.newContent}
            />
          </div>
        )}
      </div>
    </div>
  )
}
