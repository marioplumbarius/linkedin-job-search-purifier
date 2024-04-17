import browser from "webextension-polyfill";
import { BaseStorage } from "./base";
import { ExtensionOptions, Job } from "../dto";

export class OptionsStorage extends BaseStorage<ExtensionOptions> {
  constructor(area: browser.Storage.StorageArea) {
    super("options", area);
  }
}
