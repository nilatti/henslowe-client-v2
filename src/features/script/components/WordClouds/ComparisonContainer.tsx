import { memo, useMemo, useState } from 'react'
import WordCloud from 'react-d3-cloud'
import WordCount from './WordCount'
import type { WordCloudContextItem, WordEntry, WordLines } from './types'
import type { PlayScript } from '../../types/script'

const cloudFontSize = (word: { value: number }) => Math.log2(word.value) * 8 + 12

const StableWordCloud = memo(WordCloud)

interface ComparisonContainerProps {
  context: { item: WordCloudContextItem; lines: WordLines }
  play: PlayScript
}

export default function ComparisonContainer({ context, play }: ComparisonContainerProps) {
  const [words, setWords] = useState<WordLines>(context.lines)

  const includedOriginalWords = useMemo(
    () => words.originalContent.filter(w => w.include),
    [words.originalContent]
  )
  const includedNewWords = useMemo(
    () => words.newContent.filter(w => w.include),
    [words.newContent]
  )

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
          <div className="w-[500px] h-[500px]">
            {includedOriginalWords.length > 0 ? (
              <StableWordCloud
                data={includedOriginalWords}
                width={500}
                height={500}
                fontSize={cloudFontSize}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">No words selected</div>
            )}
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
            <div className="w-[500px] h-[500px]">
              {includedNewWords.length > 0 ? (
                <StableWordCloud
                  data={includedNewWords}
                  width={500}
                  height={500}
                  fontSize={cloudFontSize}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">No words selected</div>
              )}
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
