import browser from "webextension-polyfill";
import { LinkedinDatasetFilterer, LinkedinUrnMapper } from "./linkedin";
import { stringToRegExp } from "./util";

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

async function listenForVoyagerJobsDashJobCards(
  details: browser.WebRequest.OnBeforeRequestDetailsType,
) {
  const filter = browser.webRequest.filterResponseData(details.requestId);
  const decoder = new TextDecoder("utf-8");
  const encoder = new TextEncoder();
  const { options } = await browser.storage.local.get("options");
  const linkedinDatasetFilterer = new LinkedinDatasetFilterer(
    options.denyList.map(stringToRegExp),
    new LinkedinUrnMapper(),
  );

  const data: ArrayBuffer[] = [];
  filter.ondata = (event) => data.push(event.data);

  filter.onstop = async () => {
    const originalDataset = decodeAndParseData(decoder, data);
    const newDataset = await linkedinDatasetFilterer.filter(originalDataset);
    const encoded = encoder.encode(JSON.stringify(newDataset));

    filter.write(encoded);
    filter.close();
  };

  return {};
}

browser.webRequest.onBeforeRequest.addListener(
  listenForVoyagerJobsDashJobCards,
  {
    urls: [
      "https://www.linkedin.com/voyager/api/voyagerJobsDashJobCards?decorationId=com.linkedin.voyager.dash.deco.jobs.search.JobSearchCardsCollection*",
    ],
    types: ["xmlhttprequest"],
  },
  ["blocking"],
);
