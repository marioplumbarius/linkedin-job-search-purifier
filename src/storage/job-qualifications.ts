import browser from "webextension-polyfill";
import { BaseStorage } from "./base";
import { JobQualifications } from "../dto";

export class JobQualificationsStorage extends BaseStorage<JobQualifications> {
  constructor(area: browser.Storage.StorageArea) {
    super("jobQualifications", area);
  }
}
