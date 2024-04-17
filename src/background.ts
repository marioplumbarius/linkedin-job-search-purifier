import browser from "webextension-polyfill";
import { LinkedinDatasetFilterer, LinkedinUrnMapper } from "./linkedin";
import { DefaultExtensionOptions } from "./dto";
import { LinkedinJobPostingParser } from "./linkedin/job-posting-parser";
import { JobSkillsStorage, JobStorage } from "./storage";
import { LinkedinJobSkillsParser } from "./linkedin/job-skills-parser";
import { OptionsStorage } from "./storage/options";
import { stringToRegExp } from "./util";

interface BackgroundScriptOptions {
  areaStorage: browser.Storage.StorageArea;
  decoder: TextDecoder;
  encoder: TextEncoder;
  optionsStorage: OptionsStorage;
  jobSkillsParser: LinkedinJobSkillsParser;
  jobSkillsStorage: JobSkillsStorage;
  jobStorage: JobStorage;
  joPostingParser: LinkedinJobPostingParser;
  linkedinDatasetFilterer: LinkedinDatasetFilterer;
  linkedinUrnMapper: LinkedinUrnMapper;
}

/**
 * Represent the background script as a class, to make the code more organized.
 */
class BackgroundScript {
  constructor(private readonly options: BackgroundScriptOptions) {}

  // TODO: move to Interceptor class
  private parseResponseData(decoder: TextDecoder, data: ArrayBuffer[]): any {
    let chunks = "";
    if (data.length === 1) {
      chunks = decoder.decode(data[0]);
    } else {
      for (let i = 0; i < data.length; i++) {
        const stream = i !== data.length - 1;
        chunks += decoder.decode(data[i], { stream });
      }
    }
    return JSON.parse(chunks);
  }

  // TODO: move to Interceptor class
  private async interceptRequest(
    details: browser.WebRequest.OnBeforeRequestDetailsType,
  ) {
    const filter = browser.webRequest.filterResponseData(details.requestId);
    const data: ArrayBuffer[] = [];
    filter.ondata = (event) => data.push(event.data);

    filter.onstop = async () => {
      const originalDataset = this.parseResponseData(
        this.options.decoder,
        data,
      );
      let newDataset = originalDataset;

      // TODO: move to another method
      if (details.url.includes("voyagerJobsDashJobCards")) {
        // Filter job listing
        newDataset =
          await this.options.linkedinDatasetFilterer.filter(originalDataset);
      } else if (details.url.includes("/jobPostings/")) {
        // Stores job posting
        const job = this.options.joPostingParser.parse(originalDataset);
        await this.options.jobStorage.set(job.id, job);
      } else if (details.url.includes("HOW_YOU_MATCH_CARD")) {
        // Stores job skills
        const jobSkills = this.options.jobSkillsParser.parse(originalDataset);
        await this.options.jobSkillsStorage.set(jobSkills.jobId, jobSkills);
      }

      const encoded = this.options.encoder.encode(JSON.stringify(newDataset));

      filter.write(encoded);
      filter.close();
    };

    return {};
  }

  init() {
    browser.webRequest.onBeforeRequest.addListener(
      async (details) => await this.interceptRequest(details),
      {
        urls: [
          "https://www.linkedin.com/voyager/api/voyagerJobsDashJobCards?decorationId=com.linkedin.voyager.dash.deco.jobs.search.JobSearchCardsCollection*",
          "https://www.linkedin.com/voyager/api/jobs/jobPostings/*?decorationId=com.linkedin.voyager.deco.jobs.web.shared.WebFullJobPosting-*",
          "https://www.linkedin.com/voyager/api/graphql*HOW_YOU_MATCH_CARD*",
        ],
        types: ["xmlhttprequest"],
      },
      ["blocking"],
    );
  }
}

(async () => {
  const linkedinUrnMapper = new LinkedinUrnMapper();
  const areaStorage = browser.storage.local;
  const optionsStorage = new OptionsStorage(areaStorage);
  const extensionOptions =
    (await optionsStorage.get("denyList")) || DefaultExtensionOptions;
  new BackgroundScript({
    areaStorage: browser.storage.local,
    decoder: new TextDecoder("utf-8"),
    encoder: new TextEncoder(),
    optionsStorage: optionsStorage,
    jobSkillsParser: new LinkedinJobSkillsParser(linkedinUrnMapper),
    jobSkillsStorage: new JobSkillsStorage(areaStorage),
    jobStorage: new JobStorage(areaStorage),
    joPostingParser: new LinkedinJobPostingParser(),
    linkedinDatasetFilterer: new LinkedinDatasetFilterer(
      extensionOptions.denyList.titles.map(stringToRegExp),
      extensionOptions.denyList.companies.map(stringToRegExp),
      linkedinUrnMapper,
    ),
    linkedinUrnMapper: linkedinUrnMapper,
  }).init();
})();
