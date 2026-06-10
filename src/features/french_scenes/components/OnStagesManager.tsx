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
}

export function OnStagesManager({
  frenchScene,
  playSkeleton,
}: OnStagesManagerProps) {
  const createOnStage = useCreateOnStage(frenchScene.id);
  const isAdmin = useIsPlayAdmin(playSkeleton.id);

  const [showForm, setShowForm] = useState(false);
  const [nonspeaking, setNonspeaking] = useState(false);

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
    });
    setNonspeaking(false);
  };

  const sortedOnStages = [...frenchScene.on_stages].sort((a, b) => {
    const nameA = a.character?.name ?? a.character_group?.name ?? "";
    const nameB = b.character?.name ?? b.character_group?.name ?? "";
    return nameA.localeCompare(nameB);
  });

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
        {sortedOnStages.length === 0 ? (
          <p className="px-4 py-3 text-sm text-gray-500">
            No characters on stage yet.
          </p>
        ) : (
          <ul>
            {sortedOnStages.map((os) => (
              <OnStageItem
                key={os.id}
                onStage={os}
                frenchSceneId={frenchScene.id}
                isAdmin={isAdmin}
              />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
