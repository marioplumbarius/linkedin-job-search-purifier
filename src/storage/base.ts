import browser from "webextension-polyfill";

export type BaseStorageItemID = string | number;

export interface BaseStorageItem {
  id: BaseStorageItemID;
}

export abstract class BaseStorage<T extends BaseStorageItem> {
  constructor(
    private readonly key: string,
    private readonly area: browser.Storage.StorageArea,
  ) {}

  async clear() {
    await this.area.remove(this.key);
  }

  async set(item: T) {
    const data = await this.area.get(this.key);
    if (!data[this.key]) data[this.key] = {};
    data[this.key][item.id] = item;

    await this.area.set(data);
  }

  async get(id: BaseStorageItemID): Promise<T | undefined> {
    const data = await this.area.get(this.key);
    if (!data[this.key]) return undefined;
    return data[this.key][id];
  }

  async getWithRetry(
    id: BaseStorageItemID,
    maxAttempts: number,
    intervalSeconds: number,
  ): Promise<T> {
    let attempts = 0;
    while (attempts <= maxAttempts) {
      const item = await this.get(id);
      if (item) return item;

      await new Promise((resolve) =>
        setTimeout(resolve, intervalSeconds * 1000),
      );
      attempts++;
    }

    throw new Error(
      JSON.stringify({
        message: "Unable to fetch item from storage after retries.",
        id,
        maxAttempts,
        intervalSeconds,
      }),
    );
  }
}
