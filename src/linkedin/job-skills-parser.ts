import { JobSkills } from "../dto";
import { LinkedinUrnMapper } from "./urn-mapper";

export interface LinkedinJobSkillsPayload {
  included: {
    $type: string;
    entityUrn: string;
    howYouMatchSection: {
      itemsMatchSection: {
        $type: string;
        groups: {
          $type: string;
          items: {
            subtitle: string;
          };
        };
      };
    }[];
  }[];
}

export class LinkedinJobSkillsParser {
  constructor(private readonly urnMapper: LinkedinUrnMapper) {}

  parse(payload: LinkedinJobSkillsPayload): JobSkills {
    let jobId: string | undefined;
    const skills: string[] = payload.included
      .filter((item) => {
        if (item.$type === "com.linkedin.voyager.dash.jobs.HowYouMatchCard") {
          // resolves the jobId in one go
          if (!jobId)
            jobId = this.urnMapper.mapEntityUrnToJobPostingId(item.entityUrn);
          return true;
        }
        return false;
      })
      .map((item) => item.howYouMatchSection)
      .flat()
      .filter((item) => item !== undefined)
      .filter(
        (item) =>
          item.itemsMatchSection &&
          item.itemsMatchSection.$type ===
            "com.linkedin.voyager.dash.jobs.ItemsMatchSection",
      )
      .map((item) => item.itemsMatchSection.groups)
      .flat()
      .filter(
        (item) =>
          item.$type === "com.linkedin.voyager.dash.jobs.ItemsMatchGroup",
      )
      .map((item) => item.items)
      .flat()
      // this is where the skills are stored
      .map((item) => item.subtitle.split(/,| and /))
      .flat()
      // remove whitespaces
      .map((item) => item.trim())
      // remove empty strings
      .filter((item) => item.length > 0);

    return {
      jobId: jobId,
      skills,
    } as JobSkills;
  }
}
