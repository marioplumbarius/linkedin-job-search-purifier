import browser from "webextension-polyfill";
import { LinkedinDatasetFilterer, LinkedinUrnMapper } from "./linkedin";
import { stringToRegExp } from "./util";
import { DefaultExtensionOptions, ExtensionOptions } from "./dto";
import { LinkedinJobPostingParser } from "./linkedin/job-posting-parser";
import { JobStorage } from "./storage";

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
  const options: ExtensionOptions = await browser.storage.local
    .get("options")
    .then((data) => data.options || DefaultExtensionOptions);
  const linkedinDatasetFilterer = new LinkedinDatasetFilterer(
    options.denyList.titles.map(stringToRegExp),
    options.denyList.companies.map(stringToRegExp),
    new LinkedinUrnMapper(),
  );
  const joPostingParser = new LinkedinJobPostingParser();
  const jobStorage = new JobStorage();

  const data: ArrayBuffer[] = [];
  filter.ondata = (event) => data.push(event.data);

  filter.onstop = async () => {
    const originalDataset = decodeAndParseData(decoder, data);
    let newDataset = originalDataset;

    // Filter job listing
    if (details.url.includes("voyagerJobsDashJobCards"))
      newDataset = await linkedinDatasetFilterer.filter(originalDataset);
    // Stores job posting
    else if (details.url.includes("jobPostings")) {
      const job = joPostingParser.parse(originalDataset);
      await jobStorage.set(job.id.toString(), job);
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
    ],
    types: ["xmlhttprequest"],
  },
  ["blocking"],
);
