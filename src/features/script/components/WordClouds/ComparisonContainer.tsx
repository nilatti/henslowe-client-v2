import { useMemo, useState } from 'react'
import { WordCloudCanvas } from '../../../../components/WordCloudCanvas'
import WordCount from './WordCount'
import type { WordCloudContextItem, WordEntry, WordLines } from './types'
import type { PlayScript } from '../../types/script'

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
          <WordCloudCanvas
            words={includedOriginalWords}
            width={500}
            height={500}
            onWordClick={w =>
              updateWords(
                words.originalContent.map(e =>
                  e.text === w.text ? { ...e, include: false } : e
                ),
                'originalContent'
              )
            }
          />
          <WordCount
            list="originalContent"
            updateWordList={updateWords}
            wordList={words.originalContent}
          />
        </div>

        {!play.canonical && (
          <div className="flex flex-col items-center">
            <h3 className="text-base font-semibold mb-2">Cut text</h3>
            <WordCloudCanvas
              words={includedNewWords}
              width={500}
              height={500}
              onWordClick={w =>
                updateWords(
                  words.newContent.map(e =>
                    e.text === w.text ? { ...e, include: false } : e
                  ),
                  'newContent'
                )
              }
            />
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
