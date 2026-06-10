import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { parseISO, format } from "date-fns";
import { buildUserName } from "./actorUtils";
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
  heading: string;
}

interface Scene {
  pretty_name: string;
}

interface FrenchScene {
  pretty_name: string;
}

interface Space {
  name: string;
}

interface Rehearsal {
  id: number;
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

function upcomingRehearsalsList({ rehearsals }: {
  rehearsals: Rehearsal[];
}): ReactElement[] {
  const dateRangeStart = new Date();
  dateRangeStart.setDate(dateRangeStart.getDate() - 1);
  const dateRangeEnd = new Date();
  dateRangeEnd.setDate(dateRangeEnd.getDate() + 7);
  return rehearsals
    .filter(
      (rehearsal) =>
        new Date(rehearsal.start_time) > dateRangeStart &&
        new Date(rehearsal.start_time) < dateRangeEnd
    )
    .sort((a, b) => (a.start_time > b.start_time ? 1 : -1))
    .map((rehearsal) => (
      <tr key={rehearsal.id}>
        <td>
          {format(parseISO(rehearsal.start_time), DATE_TIME_FORMAT)}
          -
          {format(parseISO(rehearsal.end_time), TIME_FORMAT)}
        </td>
        <td>{rehearsal.space && <span>{rehearsal.space.name}</span>}</td>
        <td>{rehearsal.title && <strong>{rehearsal.title}</strong>}</td>
        <td>{rehearsal.notes && <span>{rehearsal.notes}</span>}</td>
        <td>
          {rehearsalContent({
            acts: rehearsal.acts,
            frenchScenes: rehearsal.french_scenes,
            scenes: rehearsal.scenes,
          }).join(", ")}
        </td>
        <td>
          <ul>
            {rehearsal.users.map((user) => (
              <li key={user.id}>
                <Link to={`/users/${user.id}` as never}>{buildUserName(user)}</Link>
              </li>
            ))}
          </ul>
        </td>
      </tr>
    ));
}

export { rehearsalContent, upcomingRehearsalsList, unavailableUsers };
