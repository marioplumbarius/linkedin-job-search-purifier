import browser from "webextension-polyfill";
import { BaseStorage } from "./base";
import { Job } from "../dto";

export class JobStorage extends BaseStorage<Job> {
  constructor() {
    super("jobs", browser.storage.local);
  }
}
