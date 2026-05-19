import _ from "lodash";
import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { UserLink } from "./actorUtils";
import type { User } from "./actorUtils";

interface Character {
  name: string;
}

interface Specialization {
  title: string;
}

interface Play {
  title?: string;
}

interface Production {
  play?: Play;
}

interface Theater {
  name?: string;
}

interface Casting {
  user_id: number;
  character: Character;
}

interface Job {
  theater_id: number;
  production_id?: number | null;
  specialization: Specialization;
  character?: Character;
  production?: Production;
  theater?: Theater;
}

export function groupCastingByActor(availableActors: User[], castings: Casting[]): (ReactElement | undefined)[] {
  const grouped = _.groupBy(castings, "user_id");
  const actorIds = _.compact(Object.keys(grouped));
  return actorIds.map((actorId) => {
    if (actorId !== null) {
      const actor = _.find(availableActors, ["id", _.toNumber(actorId)]);
      if (actor) {
        const actorGroup = grouped[actorId];
        const characters = actorGroup.map((item) => item.character);
        const characterNames = characters.map((character) => character.name);
        return (
          <li key={actorId}>
            <UserLink user={actor} />: {_.join(characterNames, ", ")}
          </li>
        );
      }
    }
  });
}

export function groupByTheater(jobs: Job[]): (ReactElement | undefined)[] {
  const grouped = _.groupBy(jobs, "theater_id");
  const theaterIds = _.compact(Object.keys(grouped));
  return theaterIds.map((theaterId) => {
    if (theaterId !== null) {
      const theaterGroup = grouped[theaterId];
      const groupedByProduction = _.groupBy(theaterGroup, "production_id");
      const nonProductionJobs = groupedByProduction["null"];
      let nonProductionJobsForTheater: ReactElement | undefined;
      if (nonProductionJobs) {
        const nonProductionJobTitles = nonProductionJobs.map(
          (job) => job.specialization.title
        );
        nonProductionJobsForTheater = (
          <li key={theaterId}>{nonProductionJobTitles.join(", ")}</li>
        );
      }
      const productionIds = _.compact(Object.keys(groupedByProduction));
      const productionsForTheater: (ReactElement | undefined)[] = productionIds.map((productionId) => {
        if (Number(productionId) >= 1) {
          const productionJobTitles = groupedByProduction[productionId].map(
            (productionJob) => {
              if (
                productionJob.specialization.title === "Actor" &&
                productionJob.character
              ) {
                return productionJob.character.name;
              } else {
                return productionJob.specialization.title;
              }
            }
          );
          return (
            <li key={productionId}>
              <Link to={`/productions/${productionId}` as never}>
                {groupedByProduction[productionId][0].production?.play?.title}
              </Link>
              : {productionJobTitles.join(", ")}
            </li>
          );
        }
      });
      if (nonProductionJobs) {
        productionsForTheater.unshift(nonProductionJobsForTheater);
      }
      const theaterName = theaterGroup[0]?.theater?.name;
      return (
        <li key={theaterId}>
          <Link to={`/theaters/${theaterId}` as never}>{theaterName}</Link>:{" "}
          <ul>{productionsForTheater}</ul>
        </li>
      );
    }
  });
}
