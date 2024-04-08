export interface ExtensionOptions {
  denyList: {
    titles: string[];
    companies: string[];
  };
}

export const DefaultExtensionOptions: ExtensionOptions = {
  denyList: { titles: [], companies: [] },
};
