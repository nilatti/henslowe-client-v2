/* eslint-disable react-refresh/only-export-components */
import _ from "lodash";
import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";

export interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  preferred_name?: string | null;
  fake?: boolean;
  gender?: string | null;
}

export function fakeActorGenderLabel(user: User): string | null {
  if (!user.fake) return null
  const g = user.gender ?? ''
  if (g === 'cis female' || g === 'trans female') return '(F)'
  if (g === 'cis male' || g === 'trans male') return '(M)'
  return '(NB)'
}

export function buildUserName(user: User): string {
  const userNameFirst = user.preferred_name || user.first_name || user.email;
  const userNameLast = user.last_name || user.email;
  return `${userNameFirst} ${userNameLast}`;
}

export function sortUsers<T extends User>(usersArray: T[]): T[] {
  return _.sortBy(usersArray, "last_name", "first_name", "email");
}

export function UserLink({ user }: { user: User }): ReactElement {
  if (user.fake) {
    return (
      <em style={{ color: "var(--fake-actor)" }}>{buildUserName(user)}</em>
    );
  } else {
    return <Link to={`/users/${user.id}` as never}>{buildUserName(user)}</Link>;
  }
}
