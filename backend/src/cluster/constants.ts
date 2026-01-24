export enum LLM_MODELS {
  Gpt4oMini = 'gpt-4o-mini',
}

export enum ERROR_MESSAGE {
  QueryRequired = 'Query is required',
  LlmUnavailable = 'LLM clustering is not available.',
}

export const LLM_MODEL = LLM_MODELS.Gpt4oMini;
export const LLM_MAX_RETRIES = 3;
