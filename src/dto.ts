export interface ExtensionOptions {
  denyList: {
    titles: string[];
    companies: string[];
  };
}

export const DefaultExtensionOptions: ExtensionOptions = {
  denyList: { titles: [], companies: [] },
};

export enum JobType {
  FullTime = "Full-time",
  Contract = "Contract",
  PartTime = "Part-time",
}

export enum JobSetup {
  Remote = "Remote",
  OnSite = "On-site",
  Hybrid = "Hybrid",
}

export interface JobCompany {
  name: string;
  description: string;
  followers: string;
}

export interface JobLocation {
  country: string;
  // country+state+city
  full: string;
}

export interface Job {
  applies: number;
  company: JobCompany;
  // TODO: descriptions are usually long. What signals do we need from description in form of tags?
  description: string;
  location: JobLocation;
  // TODO: ensure description doesn't mention it's a contract with possibility to become full time
  setup: JobSetup;
  // TODO: match with 'desired' skills, instead of Linkedin's "all skills" from profile
  skills: string[];
  title: string;
  // TODO: make sure the description matches this and doesn't call it remote, but it's hybrid
  type: JobType;
  url: URL;
  // TODO: compute a metric for applies vs. views. If many people viewed it but didn't apply
  // that's prob. a red flag or skills are very specific?
  views: number;
}
