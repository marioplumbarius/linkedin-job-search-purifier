import { LinkedinUrnMapper } from "./urn-mapper";

enum LinkedinDatasetType {
  JobPosting = "com.linkedin.voyager.dash.jobs.JobPosting",
  JobPostingCard = "com.linkedin.voyager.dash.jobs.JobPostingCard",
}

interface LinkedinJobPosting {
  $type: LinkedinDatasetType;
  title: string;
  trackingUrn: string;
}
interface LinkedinJobPostingCard {
  $type: LinkedinDatasetType;
  entityUrn: string;
  jobCardUnion: { "*jobPostingCard": string };
}

type LinkedinIncludedDataset = (LinkedinJobPosting | LinkedinJobPostingCard)[];
type LinkedinDataDataset = { elements: LinkedinJobPostingCard[] };

export interface LinkedinDataset {
  included: LinkedinIncludedDataset;
  data: LinkedinDataDataset;
}

export class LinkedinDatasetFilterer {
  constructor(
    private readonly titleDenyList: RegExp[],
    private readonly urnMapper: LinkedinUrnMapper,
  ) {}

  private isJobPostingTitleAllowed(title: string): boolean {
    for (const regexp of this.titleDenyList)
      if (regexp.exec(title)) return false;
    return true;
  }

  /**
   * Filter the provided linkedin dataset.
   * Note it mutates the data structure in-place and also returns it at the end.
   *
   * @param dataset the linkedin dataset
   * @returns mutated dataset after applying filters
   */
  async filter(dataset: LinkedinDataset): Promise<LinkedinDataset> {
    // Find the list of job posting ids to keep (excluding the ones in the deny lists)
    const jobPostingIds = dataset.included
      .filter((item) => item.$type === LinkedinDatasetType.JobPosting)
      .map((item) => item as LinkedinJobPosting)
      .filter((item) => this.isJobPostingTitleAllowed(item.title))
      .map((item) =>
        this.urnMapper.mapTrackingUrnToJobPostingId(item.trackingUrn),
      );

    // Remove items from the 'included' dataset that do not match
    // the job posting ids above.
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

      return jobPostingIds.includes(jobPostingId);
    });

    // Remove items from the 'data.elements' dataset that do not match
    // the job posting ids above.
    dataset.data.elements = dataset.data.elements.filter((item) => {
      const jobPostingId = this.urnMapper.mapEntityUrnToJobPostingId(
        item.jobCardUnion["*jobPostingCard"],
      );
      return jobPostingIds.includes(jobPostingId);
    });

    return dataset;
  }
}
