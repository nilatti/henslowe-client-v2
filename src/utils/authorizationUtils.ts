import {
  THEATER_ADMIN,
  PRODUCTION_ADMIN,
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
  is_superadmin?: boolean;
  jobs: Job[];
}

interface Theater {
  id: number;
}

interface Production {
  id: number;
  theater_id?: number;
}

export function getSuperAdminRole(user: { is_superadmin?: boolean }): boolean {
  return user?.is_superadmin === true;
}

// Theater admin status requires a theater-level job (no production_id).
// Production-level jobs, even with admin titles, do not confer theater-wide admin.
function isTheaterLevelAdminJob(job: Job): boolean {
  return job.production_id == null &&
    THEATER_ADMIN.includes(job.specialization?.title ?? '');
}

export function getUserRoleForTheater(
  user: { is_superadmin?: boolean },
  theaterJobs: Job[]
): 'admin' | 'member' | 'visitor' {
  if (getSuperAdminRole(user)) return 'admin';
  if (theaterJobs.length === 0) return 'visitor';
  if (theaterJobs.some(isTheaterLevelAdminJob)) return 'admin';
  return 'member';
}

export function getUserRoleForProduction(
  user: { is_superadmin?: boolean },
  productionJobs: Job[],
  theaterJobs?: Job[]
): 'admin' | 'member' | 'visitor' {
  if (getSuperAdminRole(user)) return 'admin';

  // Theater-level admin job → admin on all productions at this theater
  if (theaterJobs?.some(isTheaterLevelAdminJob)) return 'admin';

  if (productionJobs.length) {
    const jobTitles = productionJobs
      .map((job) => job.specialization?.title)
      .filter((t): t is string => t != null);
    // Both PRODUCTION_ADMIN and THEATER_ADMIN titles on a production job → admin
    if (intersection(jobTitles, [...PRODUCTION_ADMIN, ...THEATER_ADMIN]).length > 0) {
      return 'admin';
    }
    return 'member';
  }

  // Theater-level non-admin job → view-only on all productions at this theater
  if (theaterJobs?.some(j => j.production_id == null)) return 'member';

  return 'visitor';
}

export function getUserRoleForTheaterById(user: User, theaterId: number): 'admin' | 'member' | 'visitor' {
  const theaterJobs = user.jobs.filter(j => j.theater_id === theaterId);
  return getUserRoleForTheater(user, theaterJobs);
}

export function theatersWhereUserIsAdmin(user: User, theaters: Theater[]): Theater[] {
  return theaters.filter(theater => {
    const theaterJobs = user.jobs.filter(j => j.theater_id === theater.id);
    return getUserRoleForTheater(user, theaterJobs) === 'admin';
  });
}

export function productionsWhereUserIsAdmin(user: User, productions: Production[]): Production[] {
  return productions.filter(production => {
    const productionJobs = user.jobs.filter(j => j.production_id === production.id);
    const theaterId = production.theater_id ?? productionJobs[0]?.theater_id ?? 0;
    const theaterJobs = user.jobs.filter(j => j.theater_id === theaterId);
    return getUserRoleForProduction(user, productionJobs, theaterJobs) === 'admin';
  });
}
