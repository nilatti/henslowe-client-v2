import type { PlayScript } from '../types/script'

export type SelectionKey =
  | 'play'
  | `act-${number}`
  | `scene-${number}-${number}`
  | `fs-${number}-${number}-${number}`

interface TextSelectorProps {
  play: PlayScript
  selectedKey: SelectionKey | null
  onSelect: (key: SelectionKey) => void
}

export function TextSelector({ play, selectedKey, onSelect }: TextSelectorProps) {
  return (
    <nav className="w-48 shrink-0 text-sm overflow-y-auto max-h-screen sticky top-4">
      <button
        onClick={() => onSelect('play')}
        className={`w-full text-left px-3 py-1.5 rounded text-sm font-medium mb-1 ${
          selectedKey === 'play'
            ? 'bg-blue-100 text-blue-700'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        Full play
      </button>

      {play.acts.map(act => (
        <div key={act.id} className="mb-1">
          <button
            onClick={() => onSelect(`act-${act.id}`)}
            className={`w-full text-left px-3 py-1.5 rounded text-sm font-medium ${
              selectedKey === `act-${act.id}`
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Act {act.number}
          </button>

          {act.scenes.map(scene => (
            <div key={scene.id} className="ml-3">
              <button
                onClick={() => onSelect(`scene-${act.id}-${scene.id}`)}
                className={`w-full text-left px-3 py-1 rounded text-xs ${
                  selectedKey === `scene-${act.id}-${scene.id}`
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                Scene {scene.pretty_name}
              </button>

              {scene.french_scenes.map(fs => (
                <button
                  key={fs.id}
                  onClick={() =>
                    onSelect(`fs-${act.id}-${scene.id}-${fs.id}`)
                  }
                  className={`w-full text-left px-3 py-0.5 rounded text-xs ml-2 ${
                    selectedKey === `fs-${act.id}-${scene.id}-${fs.id}`
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-400 hover:bg-gray-100'
                  }`}
                >
                  {fs.pretty_name}
                </button>
              ))}
            </div>
          ))}
        </div>
      ))}
    </nav>
  )
}
