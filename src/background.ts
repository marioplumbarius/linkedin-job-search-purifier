import browser from "webextension-polyfill";
import { LinkedinDatasetFilterer, LinkedinUrnMapper } from "./linkedin";
import { stringToRegExp } from "./util";
import { DefaultExtensionOptions, ExtensionOptions } from "./dto";
import { LinkedinJobPostingParser } from "./linkedin/job-posting-parser";
import { JobSkillsStorage, JobStorage } from "./storage";
import { LinkedinJobSkillsParser } from "./linkedin/job-skills-parser";

function decodeAndParseData(decoder: TextDecoder, data: ArrayBuffer[]): any {
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

async function interceptRequest(
  details: browser.WebRequest.OnBeforeRequestDetailsType,
) {
  const filter = browser.webRequest.filterResponseData(details.requestId);
  const decoder = new TextDecoder("utf-8");
  const encoder = new TextEncoder();
  const areaStorage = browser.storage.local;
  const options: ExtensionOptions = await areaStorage
    .get("options")
    .then((data) => data.options || DefaultExtensionOptions);
  const linkedinUrnMapper = new LinkedinUrnMapper();
  const linkedinDatasetFilterer = new LinkedinDatasetFilterer(
    options.denyList.titles.map(stringToRegExp),
    options.denyList.companies.map(stringToRegExp),
    linkedinUrnMapper,
  );
  const joPostingParser = new LinkedinJobPostingParser();
  const jobSkillsParser = new LinkedinJobSkillsParser(linkedinUrnMapper);
  const jobStorage = new JobStorage(areaStorage);
  const jobSkillsStorage = new JobSkillsStorage(areaStorage);

  const data: ArrayBuffer[] = [];
  filter.ondata = (event) => data.push(event.data);

  filter.onstop = async () => {
    const originalDataset = decodeAndParseData(decoder, data);
    let newDataset = originalDataset;

    // Filter job listing
    if (details.url.includes("voyagerJobsDashJobCards"))
      newDataset = await linkedinDatasetFilterer.filter(originalDataset);
    // Stores job posting
    else if (details.url.includes("/jobPostings/")) {
      const job = joPostingParser.parse(originalDataset);
      await jobStorage.set(job.id, job);
    } else if (details.url.includes("HOW_YOU_MATCH_CARD")) {
      // Stores job skills
      const jobSkills = jobSkillsParser.parse(originalDataset);
      await jobSkillsStorage.set(jobSkills.jobId, jobSkills);
    }
    const encoded = encoder.encode(JSON.stringify(newDataset));

    filter.write(encoded);
    filter.close();
  };

  return {};
}

browser.webRequest.onBeforeRequest.addListener(
  interceptRequest,
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
