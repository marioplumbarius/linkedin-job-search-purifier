import browser from "webextension-polyfill";
import { BaseStorage } from "./base";
import { JobSkills } from "../dto";

export class JobSkillsStorage extends BaseStorage<JobSkills> {
  constructor(area: browser.Storage.StorageArea) {
    super("jobSkills", area);
  }
}
