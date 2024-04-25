import { JobExtras } from "./dto";
import { JobExtrasStorage, JobSkillsStorage, JobStorage } from "./storage";
import { Unit, getJobIdFromURL } from "./util";
import browser from "webextension-polyfill";

type CurrentJobIdChangedCallback = (newJobId: string) => void;

interface ContentScriptOptions {
  intervalCheckJobIdChangedSecs: number;
  jobExtrasStorage: JobExtrasStorage;
  jobStorage: JobStorage;
  jobSkillsStorage: JobSkillsStorage;
}

/**
 * Represent the content script as a class, to make the code more organized.
 */
class ContentScript {
  // used to keep track of what the user is looking at
  private currentJobId: string | undefined;

  constructor(private readonly options: ContentScriptOptions) {}

  private onCurrentJobIdChanged(callback: CurrentJobIdChangedCallback) {
    // function that checks if the id changes, and triggers the callback
    const checkAndNotify = () => {
      const newJobId = getJobIdFromURL();
      if (newJobId && newJobId !== this.currentJobId) {
        this.currentJobId = newJobId;
        callback(newJobId);
      }
    };

    // schedules the listener
    setInterval(
      checkAndNotify,
      this.options.intervalCheckJobIdChangedSecs * Unit.Millisecond,
    );
  }

  // TODO: move to JobPostingRendering class
  // TODO: clean up duplicate tags left behind on page refresh. For some reason Linkedin is doing
  // that.
  private renderJobExtras(jobExtras: JobExtras) {
    const elementId = "job-extras";
    const $newElement = document.createElement("li");
    $newElement.id = elementId;
    $newElement.className = "job-details-jobs-unified-top-card__job-insight";
    $newElement.innerHTML = `
      <div class="flex-shrink-zero mr2 t-black--light">
        <div class="ivm-image-view-model">
          <div class="ivm-view-attr__img-wrapperdisplay-flex">
            <svg
              role="none"
              aria-hidden="true"
              class="ivm-view-attr__icon"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              data-supported-dps="24x24"
              data-test-icon="lightbulb-medium"
            >
              <use href="#lightbulb-medium" width="24" height="24"></use>
            </svg>
          </div>
        </div>
      </div>
      <span>
        PR/Citizen-only: ${jobExtras.prOrCitizenshipRequired},
        Visa Sponsorship Provided: ${jobExtras.visaSponsorshipProvided}
      </span>`;

    // If element is already present, replace it. Otherwise, add it.
    const $existingElement = document.getElementById(elementId);
    if ($existingElement)
      $existingElement.replaceWith($newElement.firstElementChild!);
    else document.querySelectorAll(".mt2.mb2>ul")[0].appendChild($newElement);
  }

  init() {
    // Fetch job from storage once user clicks on job title.
    // Assume the background script already stored the job in storage.
    this.onCurrentJobIdChanged(async (newJobId: string) => {
      console.info(`Job ID changed to ${newJobId}`);

      const job = await this.options.jobStorage.getWithRetry(newJobId, 3, 1);
      console.info(`Loaded job: ${job.title}`);

      const jobSkills = await this.options.jobSkillsStorage.getWithRetry(
        newJobId,
        3,
        1,
      );
      console.info(`Loaded jobSkills: ${jobSkills?.skills}`);

      await this.options.jobExtrasStorage
        .getWithRetry(newJobId, 3, 1)
        .then((jobExtras) => this.renderJobExtras(jobExtras));

      /**
       * TODO:
       * 1. Integrate with AI (remotely)
       *  - Results may vary across models (Gemini vs. GPT-3.5 vs. Claude, etc.)
       *  - Start with single model, then, let user decide which model to use
       *  - Questions:
       *    - Is this job for visa-sponsored?
       *    - Is this job for non-visa-sponsored?
       *  - Rating
       *    - Goal is to rate the job as go/maybe/no-go
       * 1.1. Ensure Description match search filters
       *  - ensure description doesn't mention it's a contract with possibility to become full time
       * For example: remote vs. hybrid. Full-time vs. "contract initially".
       * 2. Options UI modifications
       *  - Let user provide API key
       * 3. Storage
       *  - Create separate storage for AI responses; use job id as hash key
       * 4. Linkedin UI
       *  - Add info to DOM
       *  - For example, "citizen-only: bool", "no-visa-sponsorship: bool"
       * 5. Match desired skills, not ALL skills
       *  - Linkedin looks at all skills from user profile to find matches to job roles
       * I worked as a FE at the beginning of my career, and while I have that as a skill, I'd
       * rather work as a backend nowadays. Provide an option for the user to pick desired skills,
       * and add a new entry to the UI to tell the user how many desired skills matches the current
       * job posting.
       * 6. Views vs. Applies Metric
       * - compute a metric for applies vs. views. If many people viewed it but didn't apply that's
       * prob. a red flag or skills are very specific?
       */
    });

    // Clear storage on page refresh/exit.
    // This is needed to avoid storing unlimited number of jobs in storage.
    // Assume Linkedin won't cache job data on refresh/exit.
    window.addEventListener(
      "beforeunload",
      async () => await this.options.jobStorage.clear(),
    );
    window.addEventListener(
      "beforeunload",
      async () => await this.options.jobSkillsStorage.clear(),
    );
    window.addEventListener(
      "beforeunload",
      async () => await this.options.jobExtrasStorage.clear(),
    );
  }
}

const areaStorage = browser.storage.local;
new ContentScript({
  intervalCheckJobIdChangedSecs: 1,
  jobExtrasStorage: new JobExtrasStorage(areaStorage),
  jobStorage: new JobStorage(areaStorage),
  jobSkillsStorage: new JobSkillsStorage(areaStorage),
}).init();
