import { JobStorage } from "./storage";
import { Unit, getJobIdFromURL } from "./util";

type CurrentJobIdChangedCallback = (newJobId: string) => void;

interface ContentScriptOptions {
  intervalCheckJobIdChangedSecs: number;
  jobStorage: JobStorage;
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

  init() {
    // Fetch job from storage once user clicks on job title.
    // Assume the background script already stored the job in storage.
    this.onCurrentJobIdChanged(async (newJobId: string) => {
      console.info(`Job ID changed to ${newJobId}`);

      const job = await this.options.jobStorage.getWithRetry(newJobId, 3, 1);
      console.info(`Loaded job: ${job.title}`);

      /**
       * TODO:
       * 1. Integrate with AI (remotely)
       *  - Results may vary across models (Gemini vs. GPT-3.5 vs. Claude, etc.)
       *  - Start with single model, then, let user decide which model to use
       *  - Questions:
       *    - Is this job for citizen-only?
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
    window.addEventListener("beforeunload", this.options.jobStorage.clear);
  }
}

new ContentScript({
  intervalCheckJobIdChangedSecs: 1,
  jobStorage: new JobStorage(),
}).init();
