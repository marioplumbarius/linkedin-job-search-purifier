import browser from "webextension-polyfill";

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

  const data: ArrayBuffer[] = [];
  filter.ondata = (event) => data.push(event.data);

  filter.onstop = async () => {
    const parsed = decodeAndParseData(decoder, data);
    const encoded = encoder.encode(JSON.stringify(parsed));

    // TODO: filter out job titles matching denyList

    filter.write(encoded);
    filter.close();
  };

  return {};
}

browser.webRequest.onBeforeRequest.addListener(
  listenForVoyagerJobsDashJobCards,
  {
    urls: [
      "https://www.linkedin.com/voyager/api/voyagerJobsDashJobCards?decorationId=com.linkedin.voyager.dash.deco.jobs.search.JobSearchCardsCollection-199*",
    ],
    types: ["xmlhttprequest"],
  },
  ["blocking"],
);
