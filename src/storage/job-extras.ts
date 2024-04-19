import browser from "webextension-polyfill";
import { BaseStorage } from "./base";
import { JobExtras } from "../dto";

export class JobExtrasStorage extends BaseStorage<JobExtras> {
  constructor(area: browser.Storage.StorageArea) {
    super("jobExtras", area);
  }
}
