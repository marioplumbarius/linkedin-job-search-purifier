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

export interface JobLocation {
  country: string;
  // country+state+city
  full: string;
}

export interface JobCompany {
  name: string;
  description: string;
  followers: number;
  location: JobLocation;
}

export interface Job {
  applies: number;
  company: JobCompany;
  description: string;
  id: string;
  setup: JobSetup;
  title: string;
  type: JobType;
  url: string;
  views: number;
}

export interface JobSkills {
  jobId: string;
  skills: string[];
}

export interface JobExtras {
  jobId: string;
  prOrCitizenshipRequired: boolean;
}
