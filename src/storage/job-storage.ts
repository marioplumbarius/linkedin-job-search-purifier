import browser from "webextension-polyfill";
import { Job } from "../dto";

export class JobStorage {
  private static key: string = "jobs";

  async clear() {
    await browser.storage.local.remove(JobStorage.key);
  }

  async set(job: Job) {
    const data = await browser.storage.local.get(JobStorage.key);
    if (!data.jobs) data.jobs = {};
    data.jobs[job.id] = job;

    await browser.storage.local.set(data);
  }

  async get(id: number): Promise<Job | undefined> {
    const data = await browser.storage.local.get(JobStorage.key);
    if (!data.jobs) return undefined;
    return data.jobs[id];
  }

  async getWithRetry(
    id: number,
    maxAttempts: number,
    intervalSeconds: number,
  ): Promise<Job> {
    let attempts = 0;
    while (attempts <= maxAttempts) {
      const job = await this.get(id);
      if (job) return job;

      await new Promise((resolve) =>
        setTimeout(resolve, intervalSeconds * 1000),
      );
      attempts++;
    }

    throw new Error(
      `Unable to fetch job from storage with id: ${id}. maxAttempts: ${maxAttempts}. intervalSeconds: ${intervalSeconds}`,
    );
  }
}
