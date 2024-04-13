import { Job, JobCompany, JobSetup, JobType } from "../dto";

export class JobParser {
  private parseSkills(): string[] {
    const skills: string[] = [];
    document
      // Skills are split across two elements, so we have to collect from both
      .querySelectorAll(
        ".job-details-how-you-match__skills-item-subtitle,.job-details-how-you-match__skills-item-subtitle",
      )
      .forEach(($element) => {
        const innerSkills = $element
          //   The last skill pair always end with " and "
          .textContent!.replace(" and ", ",")
          //   convert string to list
          .split(",")
          //   remove whitespace in start and end
          .map((skill) => skill.trim())
          //   remove empty strings
          .filter((skill) => skill.length > 0);
        skills.push(...innerSkills);
      });
    return skills;
  }

  parse(): Job {
    return {
      title: document.querySelector(
        "h2.job-details-jobs-unified-top-card__job-title>a>span",
      )!.textContent,
      description: document.querySelector("#job-details>span")!.textContent,
      setup: document.querySelector(
        '.job-details-jobs-unified-top-card__job-insight>span>span>span [aria-hidden="true"]',
      )!.textContent as JobSetup,
      type: document
        .getElementsByClassName(
          "job-details-jobs-unified-top-card__job-insight-view-model-secondary",
        )[0]
        .querySelector("span>span [aria-hidden=true]")!.textContent as JobType,
      skills: this.parseSkills(),
      company: {
        name: document
          .querySelector(
            ".jobs-company .artdeco-entity-lockup__content>.artdeco-entity-lockup__title>a",
          )!
          .textContent!.trim(),
        followers: document
          .querySelector(
            ".jobs-company .artdeco-entity-lockup__content>.artdeco-entity-lockup__subtitle",
          )!
          .textContent!.trim()
          .split(/\s/)[0],
        description: document
          .querySelector(".jobs-company__company-description")!
          .textContent!.trim(),
      } as JobCompany,
    } as Job;
  }
}
