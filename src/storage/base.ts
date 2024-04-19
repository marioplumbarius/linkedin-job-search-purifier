import browser from "webextension-polyfill";

export abstract class BaseStorage<Item> {
  constructor(
    private readonly namespace: string,
    private readonly area: browser.Storage.StorageArea,
  ) {}

  async clear() {
    await this.area.remove(this.namespace);
  }

  async set(id: string, item: Item) {
    const data = await this.area.get(this.namespace);
    if (!data[this.namespace]) data[this.namespace] = {};
    data[this.namespace][id] = item;

    await this.area.set(data);
  }

  async get(id?: string): Promise<Item | undefined> {
    const data = await this.area.get(this.namespace);
    if (!data[this.namespace]) return undefined;
    if (id) return data[this.namespace][id];
    else return data[this.namespace];
  }

  async getWithRetry(
    id: string,
    maxAttempts: number,
    intervalSeconds: number,
  ): Promise<Item> {
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
        namespace: this.namespace,
        id,
        maxAttempts,
        intervalSeconds,
      }),
    );
  }
}
