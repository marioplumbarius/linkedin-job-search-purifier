import { JobQualifications } from "../dto";
import { LinkedinUrnMapper } from "./urn-mapper";

type ItemsMatchGroup = {
  $type: string;
  items: { subtitle: string }[];
  itemsDescription?: {
    text: string;
  };
};

type QualificationMatchGroup = {
  $type: string;
  qualification: {
    qualificationList: {
      $type: string;
      qualifications: string[];
    };
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
      } | null;
      qualificationSection: {
        $type: string;
        groups: QualificationMatchGroup[];
      } | null;
    }[];
  }[];
}

export class LinkedinJobQualificationsParser {
  constructor(private readonly urnMapper: LinkedinUrnMapper) {}

  parse(payload: LinkedinJobSkillsPayload): JobQualifications {
    let jobId: string | undefined;

    const sections = payload.included
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
      .flat();

    const qualifications = sections
      .filter(
        (section) =>
          section.qualificationSection != null &&
          section.qualificationSection.$type ===
            "com.linkedin.voyager.dash.jobs.JobQualificationSection",
      )
      .map((section) => section.qualificationSection!.groups)
      .flat()
      .filter(
        (group) =>
          group.$type ===
          "com.linkedin.voyager.dash.jobs.JobQualificationGroup",
      )
      .filter(
        (group) =>
          group.qualification.qualificationList.$type ===
          "com.linkedin.voyager.dash.jobs.JobQualificationList",
      )
      .map((group) => group.qualification.qualificationList.qualifications)
      .flat();

    const itemsGroups = sections
      .filter((section) => section.itemsMatchSection != null)
      .map((section) => section.itemsMatchSection!.groups)
      .flat();

    const itemsSkills: string[] = itemsGroups
      .filter((group) => group.items.length > 0)
      .map((group) => group.items)
      .flat()
      .map((item) => {
        return item!.subtitle.split(/,| and /);
      })
      .flat();

    const itemsDescriptionSkills: string[] = itemsGroups
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
      // Linkedin store as qualifications, but display as requirements.
      requirements: qualifications,
      skills,
    } as JobQualifications;
  }
}
