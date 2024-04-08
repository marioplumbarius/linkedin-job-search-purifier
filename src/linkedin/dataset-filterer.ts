import { LinkedinUrnMapper } from "./urn-mapper";

enum LinkedinDatasetType {
  JobCard = "com.linkedin.voyager.dash.jobs.JobCard",
  JobPosting = "com.linkedin.voyager.dash.jobs.JobPosting",
  JobPostingCard = "com.linkedin.voyager.dash.jobs.JobPostingCard",
}

interface LinkedinJobPosting {
  $type: LinkedinDatasetType;
  title: string;
  trackingUrn: string;
}

interface LinkedinJobCard {
  $type: LinkedinDatasetType;
  entityUrn: string;
  jobCardUnion: { "*jobPostingCard": string };
}

interface LinkedinJobPostingCard {
  $type: LinkedinDatasetType;
  entityUrn: string;
  primaryDescription?: { text: string };
}

type LinkedinIncludedDataset = (LinkedinJobPosting | LinkedinJobPostingCard)[];
type LinkedinDataDataset = { elements: LinkedinJobCard[] };

export interface LinkedinDataset {
  included: LinkedinIncludedDataset;
  data: LinkedinDataDataset;
}

export class LinkedinDatasetFilterer {
  constructor(
    private readonly titleDenyList: RegExp[],
    private readonly companyDenyList: RegExp[],
    private readonly urnMapper: LinkedinUrnMapper,
  ) {}

  private isJobPostingAllowed(denyList: RegExp[], target: string): boolean {
    for (const regexp of denyList) if (regexp.exec(target)) return false;
    return true;
  }

  private isJobPostingTitleAllowed(title: string): boolean {
    return this.isJobPostingAllowed(this.titleDenyList, title);
  }

  private isJobPostingCompanyAllowed(company: string): boolean {
    return this.isJobPostingAllowed(this.companyDenyList, company);
  }

  /**
   * Filter the provided linkedin dataset.
   * Note it mutates the data structure in-place and also returns it at the end.
   *
   * @param dataset the linkedin dataset
   * @returns mutated dataset after applying filters
   */
  async filter(dataset: LinkedinDataset): Promise<LinkedinDataset> {
    // Build a list of job posting ids to exclude by title
    const jobPostingIdsByTitle = dataset.included
      .filter((item) => item.$type === LinkedinDatasetType.JobPosting)
      .map((item) => item as LinkedinJobPosting)
      .filter((item) => !this.isJobPostingTitleAllowed(item.title))
      .map((item) =>
        this.urnMapper.mapTrackingUrnToJobPostingId(item.trackingUrn),
      );

    // Build a list of job posting ids to exclude by company
    const jobPostingIdsByCompany = dataset.included
      .filter((item) => item.$type === LinkedinDatasetType.JobPostingCard)
      .map((item) => item as LinkedinJobPostingCard)
      .filter((item) =>
        item.primaryDescription
          ? !this.isJobPostingCompanyAllowed(item.primaryDescription.text)
          : false,
      )
      .map((item) => this.urnMapper.mapEntityUrnToJobPostingId(item.entityUrn));

    const jobPostingIdsToExclude = [
      ...new Set([...jobPostingIdsByTitle, ...jobPostingIdsByCompany]),
    ];

    // Remove items from the 'included' dataset that do not match
    // jobPostingIds.
    dataset.included = dataset.included.filter((item) => {
      let jobPostingId: string;

      switch (item.$type) {
        case LinkedinDatasetType.JobPosting:
          jobPostingId = this.urnMapper.mapTrackingUrnToJobPostingId(
            (item as LinkedinJobPosting).trackingUrn,
          );
          break;
        case LinkedinDatasetType.JobPostingCard:
          jobPostingId = this.urnMapper.mapEntityUrnToJobPostingId(
            (item as LinkedinJobPostingCard).entityUrn,
          );
          break;
        default:
          return true;
      }

      return !jobPostingIdsToExclude.includes(jobPostingId);
    });

    // Remove items from the 'data.elements' dataset that do not match
    // jobPostingIds.
    dataset.data.elements = dataset.data.elements.filter((item) => {
      const jobPostingId = this.urnMapper.mapEntityUrnToJobPostingId(
        item.jobCardUnion["*jobPostingCard"],
      );
      return !jobPostingIdsToExclude.includes(jobPostingId);
    });

    return dataset;
  }
}
