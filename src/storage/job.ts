import browser from "webextension-polyfill";
import { BaseStorage } from "./base";
import { Job } from "../dto";

export class JobStorage extends BaseStorage<Job> {
  constructor(area: browser.Storage.StorageArea) {
    super("jobs", area);
  }
}
