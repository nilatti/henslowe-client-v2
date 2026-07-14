import { useState } from "react";
import { useCreateOnStage } from "../api/frenchScenes";
import { OnStageItem } from "./OnStageItem";
import { CharacterCombobox } from "./CharacterCombobox";
import type { FrenchSceneDetail } from "../types/frenchScene";
import type { PlaySkeleton } from "../../plays/types/play";
import { Button, Card } from "../../../components/ui";
import { useIsPlayAdmin } from "../../../hooks/useUserRole";

interface OnStagesManagerProps {
  frenchScene: FrenchSceneDetail;
  playSkeleton: PlaySkeleton;
  sceneId: number;
}

export function OnStagesManager({
  frenchScene,
  playSkeleton,
  sceneId,
}: OnStagesManagerProps) {
  const playId = playSkeleton.id;
  const createOnStage = useCreateOnStage(frenchScene.id, playId, sceneId);
  const isAdmin = useIsPlayAdmin(playSkeleton.id);

  const [showForm, setShowForm] = useState(false);
  const [nonspeaking, setNonspeaking] = useState(false);
  const [offstage, setOffstage] = useState(false);

  const onStageCharacterIds = new Set(
    frenchScene.on_stages.map((os) => os.character_id).filter(Boolean),
  );
  const onStageGroupIds = new Set(
    frenchScene.on_stages.map((os) => os.character_group_id).filter(Boolean),
  );

  const handleSelect = async (
    type: "character" | "character_group",
    id: number,
  ) => {
    await createOnStage.mutateAsync({
      french_scene_id: frenchScene.id,
      character_id: type === "character" ? id : null,
      character_group_id: type === "character_group" ? id : null,
      nonspeaking,
      offstage,
    });
    setNonspeaking(false);
    setOffstage(false);
  };

  const byOnStageName = (a: typeof frenchScene.on_stages[number], b: typeof frenchScene.on_stages[number]) => {
    const nameA = a.character?.name ?? a.character_group?.name ?? "";
    const nameB = b.character?.name ?? b.character_group?.name ?? "";
    return nameA.localeCompare(nameB);
  };

  const sortedCharacterOnStages = frenchScene.on_stages
    .filter((os) => os.character_id != null)
    .sort(byOnStageName);
  const sortedGroupOnStages = frenchScene.on_stages
    .filter((os) => os.character_group_id != null)
    .sort(byOnStageName);

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 mb-3">
        On Stage ({frenchScene.on_stages.length})
      </h3>
      {isAdmin && !showForm && (
        <Button className="mb-3" onClick={() => setShowForm(true)}>
          Add Character
        </Button>
      )}

      {showForm && (
        <Card className="p-4 mb-3">
          <div className="space-y-3">
            <CharacterCombobox
              characters={playSkeleton.characters}
              characterGroups={playSkeleton.character_groups ?? []}
              excludeCharacterIds={onStageCharacterIds as Set<number>}
              excludeGroupIds={onStageGroupIds as Set<number>}
              playId={playSkeleton.id}
              onSelect={handleSelect}
              disabled={createOnStage.isPending}
            />

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={nonspeaking}
                onChange={(e) => setNonspeaking(e.target.checked)}
                className="rounded border-gray-300"
              />
              Nonspeaking in this French scene
            </label>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={offstage}
                onChange={(e) => setOffstage(e.target.checked)}
                className="rounded border-gray-300"
              />
              Offstage in this French scene
            </label>

            <div className="flex justify-end">
              <Button
                variant="secondary"
                onClick={() => setShowForm(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Card>
        {frenchScene.on_stages.length === 0 ? (
          <p className="px-4 py-3 text-sm text-gray-500">
            No characters on stage yet.
          </p>
        ) : (
          <>
            {sortedCharacterOnStages.length > 0 && (
              <p className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Characters
              </p>
            )}
            {sortedCharacterOnStages.length > 0 && (
              <ul>
                {sortedCharacterOnStages.map((os) => (
                  <OnStageItem
                    key={os.id}
                    onStage={os}
                    frenchSceneId={frenchScene.id}
                    playId={playId}
                    sceneId={sceneId}
                    isAdmin={isAdmin}
                  />
                ))}
              </ul>
            )}
            {sortedGroupOnStages.length > 0 && (
              <p className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Character Groups
              </p>
            )}
            {sortedGroupOnStages.length > 0 && (
              <ul>
                {sortedGroupOnStages.map((os) => (
                  <OnStageItem
                    key={os.id}
                    onStage={os}
                    frenchSceneId={frenchScene.id}
                    playId={playId}
                    sceneId={sceneId}
                    isAdmin={isAdmin}
                  />
                ))}
              </ul>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
