import { Job, JobCompany, JobLocation, JobSetup, JobType } from "../dto";

export class LinkedinJobPostingParser {
  private readonly regionNamesInEnglish = new Intl.DisplayNames(["en"], {
    type: "region",
  });

  parse(webFullJobPosting: any): Job {
    const data = webFullJobPosting.data;
    const included = webFullJobPosting.included;
    const company: JobCompany = {
      name: "",
      description: "",
      followers: 0,
      location: {
        country: "",
        full: data.formattedLocation,
      },
    };
    let setup: JobSetup | undefined;

    included.forEach((item: any) => {
      if (item.$type === "com.linkedin.voyager.jobs.shared.WorkplaceType")
        setup = item.localizedName as JobSetup;
      else if (item.$type === "com.linkedin.voyager.organization.Company") {
        company.name = item.name;
        company.description = item.description;
        company.location.country = this.regionNamesInEnglish.of(
          item.headquarter.country,
        )!;
      } else if (item.$type === "com.linkedin.voyager.common.FollowingInfo")
        company.followers = item.followerCount;
    });

    return {
      applies: data.applies,
      company: company,
      description: data.description.text,
      id: data.jobPostingId,
      setup: setup,
      title: data.title,
      type: data.formattedEmploymentStatus as JobType,
      url: data.jobPostingUrl,
      views: data.views,
    } as Job;
  }
}
