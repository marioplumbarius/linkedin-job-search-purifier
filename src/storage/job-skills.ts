import browser from "webextension-polyfill";
import { BaseStorage } from "./base";
import { JobSkills } from "../dto";

export class JobSkillsStorage extends BaseStorage<JobSkills> {
  constructor() {
    super("jobSkills", browser.storage.local);
  }
}
