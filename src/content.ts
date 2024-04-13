import { JobParser } from "./dom-parsers";
import { Job, JobCompany, JobSetup, JobType } from "./dto";
console.info("content script was executed!");

enum TimeUnit {
  Millisecond = 1000,
}

function fetchJobDataFromDOM(jobParser: JobParser, delayForSeconds?: number) {
  const fetch = () => {
    const job = jobParser.parse();
    console.log(`Job: ${JSON.stringify(job, undefined, 2)}`);
  };

  if (delayForSeconds)
    setTimeout(fetch, delayForSeconds * TimeUnit.Millisecond);
  else fetch();
}

function registerClickToOpenJobPosting(
  jobParser: JobParser,
  everySeconds?: number,
) {
  const register = () => {
    const $jobCardContainers = document.querySelectorAll(".job-card-container");
    $jobCardContainers.forEach(($jobCardContainer) => {
      // remove first, to avoid duplicates
      $jobCardContainer.removeEventListener("click", () =>
        fetchJobDataFromDOM(jobParser, 1),
      );
      $jobCardContainer.addEventListener("click", () =>
        fetchJobDataFromDOM(jobParser, 1),
      );
    });
  };

  if (everySeconds) setInterval(register, everySeconds * TimeUnit.Millisecond);
  else register();
}

const jobParser = new JobParser();

fetchJobDataFromDOM(jobParser, 1);
registerClickToOpenJobPosting(jobParser, 2);
