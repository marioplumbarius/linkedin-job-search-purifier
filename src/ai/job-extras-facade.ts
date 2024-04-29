import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { BaseMessage } from "@langchain/core/messages";
import { Job, JobExtras } from "../dto";

export interface JobExtrasAIFacadeOptions {
  models: {
    gemini: ChatGoogleGenerativeAI;
  };
}

const JOB_DESCRIPTION_MARKER = "{{jobDescription}}";

enum PromptTemplate {
  DEFAULT = `
    You are a helpful job search assistant.
    I will provide a job description and questions, and you should answer with yes/no, nothing else.

    Job Description: ${JOB_DESCRIPTION_MARKER}

    Question 1: Is citizenship or permanent residency required?
    Question 2: Do they provide visa sponsorship?
  `,
}

export class JobExtrasAIFacade {
  constructor(private readonly options: JobExtrasAIFacadeOptions) {}

  private buildPrompt(jobDescription: string): string {
    return PromptTemplate.DEFAULT.replace(
      JOB_DESCRIPTION_MARKER,
      jobDescription,
    );
  }

  // TODO: find a better way to convert response indices to the prompt order
  // Right now, it assumes the response comes in the order of the questions
  private parseResponse(job: Job, response: BaseMessage): JobExtras {
    // Example: "1. no\n2. yes"
    const content = response.content as string;
    const answers = content
      .split("\n")
      .map((answer: string) => answer.split(" ")[1].toLowerCase() === "yes");

    return {
      jobId: job.id,
      prOrCitizenshipRequired: answers[0],
      visaSponsorshipProvided: answers[1],
    };
  }

  async predict(job: Job): Promise<JobExtras> {
    const prompt = this.buildPrompt(job.description);
    const response = await this.options.models.gemini.invoke(prompt);
    return this.parseResponse(job, response);
  }
}
