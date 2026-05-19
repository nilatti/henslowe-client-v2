import _ from "lodash";
import {
  THEATER_ADMIN,
  PRODUCTION_ADMIN,
  SUPERUSERS,
} from "./constants";
import { intersection } from "./arrayUtils";

interface Specialization {
  title?: string;
}

export interface Job {
  end_date: string;
  theater_id: number;
  production_id?: number | null;
  specialization?: Specialization;
}

export interface User {
  id: number;
  email: string;
  jobs: Job[];
}

interface Theater {
  id: number;
}

interface Production {
  id: number;
  theater_id?: number;
}


export function getSuperAdminRole(user: { email: string }): boolean {
  return user != null && _.includes(SUPERUSERS, user.email);
}

export function getUserRoleForProduction(
  user: { email: string },
  productionJobs: Job[],
  theaterJobs?: Job[]
): 'admin' | 'member' | 'visitor' {
  if (getSuperAdminRole(user)) return 'admin';

  if (productionJobs.length) {
    const jobTitles = productionJobs
      .map((job) => job.specialization?.title)
      .filter((t): t is string => t != null);
    const isTheaterAdmin = theaterJobs != null
      ? getUserRoleForTheater(user, theaterJobs) === 'admin'
      : false;
    if (isTheaterAdmin || intersection(jobTitles, PRODUCTION_ADMIN).length > 0) {
      return 'admin';
    } else {
      return 'member';
    }
  } else {
    return 'visitor';
  }
}

export function getUserRoleForSpace(
  user: { email: string },
  theaters: { id: number }[]
): 'theater_admin' | 'visitor' {
  if (getSuperAdminRole(user)) return 'theater_admin'
  if (!theaters.length) return 'visitor'
  return 'visitor'
}

export function getUserRoleForTheater(
  user: { email: string },
  theaterJobs: Job[]
): 'admin' | 'member' | 'visitor' {
  if (getSuperAdminRole(user)) return 'admin';
  if (theaterJobs.length === 0) return 'visitor';
  const jobTitles = theaterJobs.map((job) => job.specialization?.title);
  if (_.intersection(jobTitles, THEATER_ADMIN).length > 0) {
    return 'admin';
  } else if (theaterJobs.length > 0) {
    return 'member';
  }
  return 'visitor';
}

export function productionsWhereUserIsAdmin(user: User, productions: Production[]): Production[] {
  const userAdminProductions: Production[] = [];
  productions.forEach((production) => {
    const productionJobs = user.jobs.filter(j => j.production_id === production.id);
    const theaterId = productionJobs[0]?.theater_id ?? 0;
    const theaterJobs = user.jobs.filter(j => j.theater_id === theaterId && j.production_id == null);
    if (getUserRoleForProduction(user, productionJobs, theaterJobs) === 'admin') {
      userAdminProductions.push(production);
    }
  });
  return userAdminProductions;
}

export function productionsWhereUserIsMember(user: User, productions: Production[]): Production[] {
  const userMemberProductions: Production[] = [];
  productions.forEach((production) => {
    const productionJobs = user.jobs.filter(j => j.production_id === production.id);
    const theaterId = productionJobs[0]?.theater_id ?? 0;
    const theaterJobs = user.jobs.filter(j => j.theater_id === theaterId && j.production_id == null);
    if (getUserRoleForProduction(user, productionJobs, theaterJobs) === 'member') {
      userMemberProductions.push(production);
    }
  });
  return userMemberProductions;
}

export function theatersWhereUserIsAdmin(user: User, theaters: Theater[]): Theater[] {
  const userAdminTheaters: Theater[] = [];
  theaters.forEach((theater) => {
    const theaterJobs = user.jobs.filter(j => j.theater_id === theater.id);
    if (getUserRoleForTheater(user, theaterJobs) === 'admin') {
      userAdminTheaters.push(theater);
    }
  });
  return userAdminTheaters;
}

export function theatersWhereUserIsMember(user: User, theaters: Theater[]): Theater[] {
  const userMemberTheaters: Theater[] = [];
  theaters.forEach((theater) => {
    const theaterJobs = user.jobs.filter(j => j.theater_id === theater.id);
    if (getUserRoleForTheater(user, theaterJobs) === 'member') {
      userMemberTheaters.push(theater);
    }
  });
  return userMemberTheaters;
}
