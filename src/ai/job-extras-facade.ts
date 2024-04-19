import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Job, JobExtras } from "../dto";

export interface JobExtrasAIFacadeOptions {
  models: {
    gemini: ChatGoogleGenerativeAI;
  };
}

enum PromptTemplate {
  CITIZENSHIP_OR_PR_REQUIRED = `You are a helpful job search assistant.
    Does the JOB_POSTING below require citizenship or permanent residency? Reply yes or no.
    JOB_POSTING:\n\n`,
}

export class JobExtrasAIFacade {
  constructor(private readonly options: JobExtrasAIFacadeOptions) {}

  async predict(job: Job): Promise<JobExtras> {
    const prompt = PromptTemplate.CITIZENSHIP_OR_PR_REQUIRED.concat(
      job.description,
    );
    const response = await this.options.models.gemini.invoke(prompt);

    return {
      jobId: job.id,
      prOrCitizenshipRequired: response.content === "yes",
    };
  }
}
