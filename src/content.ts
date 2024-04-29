import { JobExtras } from "./dto";
import {
  JobExtrasStorage,
  JobQualificationsStorage,
  JobStorage,
} from "./storage";
import { Unit, getJobIdFromURL } from "./util";
import browser from "webextension-polyfill";

type CurrentJobIdChangedCallback = (newJobId: string) => void;

interface ContentScriptOptions {
  intervalCheckJobIdChangedSecs: number;
  jobExtrasStorage: JobExtrasStorage;
  jobStorage: JobStorage;
  jobQualificationsStorage: JobQualificationsStorage;
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

      const jobQualifications =
        await this.options.jobQualificationsStorage.getWithRetry(
          newJobId,
          3,
          1,
        );
      console.info(`Loaded jobSkills: ${jobQualifications?.skills}`);
      console.info(
        `Loaded jobRequirements: ${jobQualifications?.requirements}`,
      );

      await this.options.jobExtrasStorage
        .getWithRetry(newJobId, 3, 1)
        .then((jobExtras) => this.renderJobExtras(jobExtras));
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
      async () => await this.options.jobQualificationsStorage.clear(),
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
  jobQualificationsStorage: new JobQualificationsStorage(areaStorage),
}).init();
