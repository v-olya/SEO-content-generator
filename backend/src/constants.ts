export enum SuggestionEndpoints {
  Bing = 'https://api.bing.com/osjson.aspx?query=',
  Google = 'https://suggestqueries.google.com/complete/search?client=chrome&q=',
  YouTube = 'https://suggestqueries.google.com/complete/search?ds=yt&client=chrome&q=',
}

export enum LLM_MODELS {
  Gpt4oMini = 'gpt-4o-mini',
}

export enum ERROR_MESSAGE {
  QueryRequired = 'Query is required',
  LlmUnavailable = 'LLM clustering is not available.',
}

export const LLM_MODEL = LLM_MODELS.Gpt4oMini;
export const LLM_MAX_RETRIES = 3;
