export interface ExtensionOptions {
  denyList: {
    titles: string[];
  };
}

export const DefaultExtensionOptions: ExtensionOptions = {
  denyList: { titles: [] },
};
