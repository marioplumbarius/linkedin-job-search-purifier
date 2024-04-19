import { JobSkills } from "../dto";
import { LinkedinUrnMapper } from "./urn-mapper";

type ItemsMatchGroup = {
  $type: string;
  items: { subtitle: string }[];
  itemsDescription?: {
    text: string;
  };
};

export interface LinkedinJobSkillsPayload {
  included: {
    $type: string;
    entityUrn: string;
    howYouMatchSection: {
      itemsMatchSection: {
        $type: string;
        groups: ItemsMatchGroup[];
      };
    }[];
  }[];
}

export class LinkedinJobSkillsParser {
  constructor(private readonly urnMapper: LinkedinUrnMapper) {}

  parse(payload: LinkedinJobSkillsPayload): JobSkills {
    let jobId: string | undefined;
    const groups: ItemsMatchGroup[] = payload.included
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
      );

    const itemsSkills: string[] = groups
      .filter((group) => group.items.length > 0)
      .map((group) => group.items)
      .flat()
      .map((item) => {
        return item!.subtitle.split(/,| and /);
      })
      .flat();

    const itemsDescriptionSkills: string[] = groups
      .filter((group) => group.itemsDescription)
      .map((group) => group.itemsDescription)
      .map((itemsDescription) => itemsDescription!.text.split(/·/))
      .flat();

    const skills = itemsSkills
      .concat(itemsDescriptionSkills)
      // remove whitespaces
      .map((item) => item.trim())
      // remove empty strings
      .filter((item) => item.length > 0)
      .sort();

    return {
      jobId: jobId,
      skills,
    } as JobSkills;
  }
}
