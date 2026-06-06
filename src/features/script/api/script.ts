import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../../api/client'
import type {
  PlayScript,
  ScriptLine,
  ScriptStageDirection,
  ScriptSoundCue,
} from '../types/script'

export const playScriptQueryOptions = (playId: number) =>
  queryOptions({
    queryKey: ['plays', playId, 'script'],
    queryFn: (): Promise<PlayScript> =>
      api.get(`/api/v1/plays/${playId}/play_script`).then(r => r.data),
    staleTime: 1000 * 60 * 5,
  })

// Immutably updates a single item within the nested script cache
function updateItemInScript(
  script: PlayScript,
  updated: { id: number },
  field: 'lines' | 'stage_directions' | 'sound_cues'
): PlayScript {
  return {
    ...script,
    acts: script.acts.map(act => ({
      ...act,
      scenes: act.scenes.map(scene => ({
        ...scene,
        french_scenes: scene.french_scenes.map(fs => ({
          ...fs,
          [field]: (fs[field] as Array<{ id: number }>).map(item =>
            item.id === updated.id ? { ...item, ...updated } : item
          ),
        })),
      })),
    })),
  }
}

export function useUpdateLine(playId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (line: Partial<ScriptLine> & { id: number }) =>
      api.put(`/api/v1/lines/${line.id}`, { line }).then(r => r.data),
    onMutate: async updated => {
      await qc.cancelQueries({ queryKey: ['plays', playId, 'script'] })
      const previous = qc.getQueryData(['plays', playId, 'script'])
      qc.setQueryData(
        ['plays', playId, 'script'],
        (old: PlayScript | undefined) => {
          if (!old) return old
          return updateItemInScript(old, updated, 'lines')
        }
      )
      return { previous }
    },
    onError: (_, __, context) => {
      if (context?.previous) {
        qc.setQueryData(['plays', playId, 'script'], context.previous)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['plays', playId, 'script'] })
    },
  })
}

interface BulkUpdateArgs {
  lineIds: number[]
  sdIds: number[]
  scIds: number[]
  newContent: string | null
}

// Single optimistic update + parallel server calls — avoids the race conditions
// that sequential mutateAsync calls create (each onSettled invalidates and can
// overwrite the next item's optimistic update before its onMutate runs).
export function useBulkUpdateLines(playId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ lineIds, sdIds, scIds, newContent }: BulkUpdateArgs) =>
      Promise.all([
        ...lineIds.map(id =>
          api.put(`/api/v1/lines/${id}`, { line: { new_content: newContent } })
        ),
        ...sdIds.map(id =>
          api.put(`/api/v1/stage_directions/${id}`, {
            stage_direction: { new_content: newContent },
          })
        ),
        ...scIds.map(id =>
          api.put(`/api/v1/sound_cues/${id}`, {
            sound_cue: { new_content: newContent },
          })
        ),
      ]),
    onMutate: async ({ lineIds, sdIds, scIds, newContent }) => {
      await qc.cancelQueries({ queryKey: ['plays', playId, 'script'] })
      const previous = qc.getQueryData(['plays', playId, 'script'])
      const lSet = new Set(lineIds)
      const sdSet = new Set(sdIds)
      const scSet = new Set(scIds)
      qc.setQueryData(
        ['plays', playId, 'script'],
        (old: PlayScript | undefined) => {
          if (!old) return old
          return {
            ...old,
            acts: old.acts.map(act => ({
              ...act,
              scenes: act.scenes.map(scene => ({
                ...scene,
                french_scenes: scene.french_scenes.map(fs => ({
                  ...fs,
                  lines: fs.lines.map(l =>
                    lSet.has(l.id) ? { ...l, new_content: newContent } : l
                  ),
                  stage_directions: fs.stage_directions.map(sd =>
                    sdSet.has(sd.id) ? { ...sd, new_content: newContent } : sd
                  ),
                  sound_cues: fs.sound_cues.map(sc =>
                    scSet.has(sc.id) ? { ...sc, new_content: newContent } : sc
                  ),
                })),
              })),
            })),
          }
        }
      )
      return { previous }
    },
    onError: (_, __, context) => {
      if (context?.previous) {
        qc.setQueryData(['plays', playId, 'script'], context.previous)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['plays', playId, 'script'] })
    },
  })
}

export function useUpdateStageDirection(playId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sd: Partial<ScriptStageDirection> & { id: number }) =>
      api
        .put(`/api/v1/stage_directions/${sd.id}`, { stage_direction: sd })
        .then(r => r.data),
    onMutate: async updated => {
      await qc.cancelQueries({ queryKey: ['plays', playId, 'script'] })
      const previous = qc.getQueryData(['plays', playId, 'script'])
      qc.setQueryData(
        ['plays', playId, 'script'],
        (old: PlayScript | undefined) => {
          if (!old) return old
          return updateItemInScript(old, updated, 'stage_directions')
        }
      )
      return { previous }
    },
    onError: (_, __, context) => {
      if (context?.previous) {
        qc.setQueryData(['plays', playId, 'script'], context.previous)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['plays', playId, 'script'] })
    },
  })
}

export function useUpdateSoundCue(playId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sc: Partial<ScriptSoundCue> & { id: number }) =>
      api
        .put(`/api/v1/sound_cues/${sc.id}`, { sound_cue: sc })
        .then(r => r.data),
    onMutate: async updated => {
      await qc.cancelQueries({ queryKey: ['plays', playId, 'script'] })
      const previous = qc.getQueryData(['plays', playId, 'script'])
      qc.setQueryData(
        ['plays', playId, 'script'],
        (old: PlayScript | undefined) => {
          if (!old) return old
          return updateItemInScript(old, updated, 'sound_cues')
        }
      )
      return { previous }
    },
    onError: (_, __, context) => {
      if (context?.previous) {
        qc.setQueryData(['plays', playId, 'script'], context.previous)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['plays', playId, 'script'] })
    },
  })
}
