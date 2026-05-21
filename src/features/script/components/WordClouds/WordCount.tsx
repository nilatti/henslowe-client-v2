import { Trash2, RefreshCw } from 'lucide-react'
import type { WordEntry } from './types'

interface WordCountProps {
  list: 'originalContent' | 'newContent'
  updateWordList: (newList: WordEntry[], list: 'originalContent' | 'newContent') => void
  wordList: WordEntry[]
}

export default function WordCount({ list, updateWordList, wordList }: WordCountProps) {
  function addWord(word: WordEntry) {
    updateWordList(
      wordList.map(w => (w === word ? { ...w, include: true } : w)),
      list
    )
  }

  function removeWord(word: WordEntry) {
    updateWordList(
      wordList.map(w => (w === word ? { ...w, include: false } : w)),
      list
    )
  }

  return (
    <div className="overflow-auto max-h-64 mt-2">
      <table className="text-xs border-collapse">
        <thead>
          <tr>
            <th className="border border-gray-300 p-1">
              add/
              <br />
              remove
            </th>
            <th className="border border-gray-300 p-1">word</th>
            <th className="border border-gray-300 p-1">count</th>
          </tr>
        </thead>
        <tbody>
          {wordList.map(word => (
            <tr key={word.text}>
              <td className="border border-gray-300 p-1">
                {word.include ? (
                  <button
                    onClick={() => removeWord(word)}
                    className="text-gray-500 hover:text-red-500"
                    title="Remove word"
                  >
                    <Trash2 size={12} />
                  </button>
                ) : (
                  <button
                    onClick={() => addWord(word)}
                    className="text-gray-500 hover:text-green-600"
                    title="Restore word"
                  >
                    <RefreshCw size={12} />
                  </button>
                )}
              </td>
              <td
                className={`border border-gray-300 p-1 ${
                  word.include ? '' : 'line-through text-red-500'
                }`}
              >
                {word.text}
              </td>
              <td
                className={`border border-gray-300 p-1 ${
                  word.include ? '' : 'line-through text-red-500'
                }`}
              >
                {word.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
