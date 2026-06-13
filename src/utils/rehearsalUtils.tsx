import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { parseISO, format } from "date-fns";
import type { User } from "./actorUtils";
import { DATE_TIME_FORMAT, TIME_FORMAT } from "./constants";

interface Conflict {
  start_time: string;
  end_time: string;
}

interface RehearsalUser extends User {
  conflicts?: Conflict[];
}

interface Act {
  id: number;
  play_id: number;
  heading: string;
}

interface Scene {
  id: number;
  act_id: number;
  pretty_name: string;
}

interface FrenchScene {
  id: number;
  scene_id: number;
  pretty_name: string;
  scene: { id: number; act_id: number };
}

interface Space {
  id: number;
  name: string;
}

interface Rehearsal {
  id: number;
  production_id: number;
  start_time: string;
  end_time: string;
  space?: Space;
  title?: string;
  notes?: string;
  acts?: Act[];
  french_scenes?: FrenchScene[];
  scenes?: Scene[];
  users: RehearsalUser[];
}

function unavailableUsers(users: RehearsalUser[], rehearsal: Rehearsal): RehearsalUser[] {
  const usersHaveConflicts = users.filter(
    (user) => user.conflicts && user.conflicts.length > 0
  );
  const unavailable = usersHaveConflicts.map((user) => {
    let conflicts_with_this_rehearsal = 0;
    user.conflicts!.map((conflict) => {
      if (
        conflict.start_time <= rehearsal.end_time &&
        rehearsal.start_time <= conflict.end_time
      ) {
        conflicts_with_this_rehearsal += 1;
      }
    });
    if (conflicts_with_this_rehearsal > 0) {
      return user;
    }
  });
  return unavailable.filter(Boolean) as RehearsalUser[];
}

function rehearsalContent({ acts, frenchScenes, scenes }: {
  acts?: Act[];
  frenchScenes?: FrenchScene[];
  scenes?: Scene[];
}): string[] {
  let content: string[] = [];
  if (acts && acts.length) {
    acts.map((item) => content.push(item.heading));
  }
  if (scenes && scenes.length) {
    scenes.map((item) => content.push(item.pretty_name));
  }
  if (frenchScenes && frenchScenes.length) {
    frenchScenes.map((item) => content.push(item.pretty_name));
  }
  content = content.sort();
  return content;
}

function upcomingRehearsalsList({ rehearsals, playIdByProductionId, dateRangeEnd }: {
  rehearsals: Rehearsal[];
  playIdByProductionId: Map<number, number>;
  dateRangeEnd?: Date | null;
}): ReactElement[] {
  const dateRangeStart = new Date();
  dateRangeStart.setDate(dateRangeStart.getDate() - 1);
  const defaultEnd = new Date();
  defaultEnd.setDate(defaultEnd.getDate() + 7);
  const endDate = dateRangeEnd === undefined ? defaultEnd : dateRangeEnd;
  return rehearsals
    .filter(
      (rehearsal) =>
        new Date(rehearsal.start_time) > dateRangeStart &&
        (endDate === null || new Date(rehearsal.start_time) < endDate)
    )
    .sort((a, b) => (a.start_time > b.start_time ? 1 : -1))
    .map((rehearsal) => {
      const playId = playIdByProductionId.get(rehearsal.production_id);
      const materialLinks: ReactElement[] = [];
      rehearsal.acts?.forEach((act) =>
        materialLinks.push(
          <Link key={`act-${act.id}`} to="/plays/$playId/acts/$actId" params={{ playId: String(act.play_id), actId: String(act.id) }} className="text-blue-600 hover:underline block">
            {act.heading}
          </Link>
        )
      );
      rehearsal.scenes?.forEach((scene) =>
        playId && materialLinks.push(
          <Link key={`scene-${scene.id}`} to="/plays/$playId/acts/$actId/scenes/$sceneId" params={{ playId: String(playId), actId: String(scene.act_id), sceneId: String(scene.id) }} className="text-blue-600 hover:underline block">
            {scene.pretty_name}
          </Link>
        )
      );
      rehearsal.french_scenes?.forEach((fs) =>
        playId && materialLinks.push(
          <Link key={`fs-${fs.id}`} to="/plays/$playId/acts/$actId/scenes/$sceneId/french-scenes/$frenchSceneId" params={{ playId: String(playId), actId: String(fs.scene.act_id), sceneId: String(fs.scene_id), frenchSceneId: String(fs.id) }} className="text-blue-600 hover:underline block">
            {fs.pretty_name}
          </Link>
        )
      );
      return (
        <tr key={rehearsal.id} className="border-b border-gray-400">
          <td className="p-[10px] border-r border-gray-300">
            <Link
              to="/productions/$productionId/rehearsals"
              params={{ productionId: String(rehearsal.production_id) }}
              hash={`rehearsal-${rehearsal.id}`}
              className="text-blue-600 hover:underline"
            >
              {format(parseISO(rehearsal.start_time), DATE_TIME_FORMAT)}
              –
              {format(parseISO(rehearsal.end_time), TIME_FORMAT)}
            </Link>
          </td>
          <td className="p-[10px] border-r border-gray-300">
            {rehearsal.space && (
              <Link to="/spaces/$spaceId" params={{ spaceId: String(rehearsal.space.id) }} className="text-blue-600 hover:underline">
                {rehearsal.space.name}
              </Link>
            )}
          </td>
          <td className="p-[10px] border-r border-gray-300">{rehearsal.title && <strong>{rehearsal.title}</strong>}</td>
          <td className="p-[10px] border-r border-gray-300">{materialLinks.length > 0 ? materialLinks : null}</td>
          <td className="p-[10px]">{rehearsal.notes && <span>{rehearsal.notes}</span>}</td>
        </tr>
      );
    });
}

export { rehearsalContent, upcomingRehearsalsList, unavailableUsers };
