export enum SuggestionEndpoints {
  Bing = 'https://api.bing.com/osjson.aspx?query=',
  Google = 'https://suggestqueries.google.com/complete/search?client=chrome&q=',
  YouTube = 'https://suggestqueries.google.com/complete/search?ds=yt&client=chrome&q=',
}

export enum LLM_MODELS {
  Gpt4oMini = 'gpt-4o-mini',
  Gpt4o = 'gpt-4o',
}

export enum ERROR_MESSAGE {
  QueryRequired = 'Query is required',
  LlmUnavailable = 'LLM clustering is not available.',
  OpenAiKeyNotConfigured = 'OpenAI API key not configured',
  ArticleGenerationTimeout = 'Article generation timed out',
  FailedToGetOpenAiResponse = 'Failed to get response from OpenAI',
  EmptyOpenAiResponse = 'Empty response from OpenAI',
  UnexpectedFinishReasonTemplate = 'Unexpected finish reason: {reason}',
  MaxIterationsReached = 'Failed to generate valid article after maximum iterations',
  ClusterNotFound = 'Cluster not found',
}

export const LLM_MODEL = LLM_MODELS.Gpt4oMini;
export const LLM_MAX_RETRIES = 3;

// Hard timeout for article generation agentic loop.
export const ARTICLE_JOB_TIMEOUT_MS = 2 * 60 * 1000;

export const ARTICLE_SYSTEM_PROMPT = `You are an expert content writer and SEO specialist. Your task is to generate high-quality HTML articles with embedded schema.org microdata.

IMPORTANT RULES:
1. You MUST use schema.org microdata attributes (itemscope, itemtype, itemprop) - NOT JSON-LD.
2. After generating the article, you MUST call the "validate_microdata" tool to verify the markup is valid.
3. If validation fails, fix the issues and validate again.
4. Only return the final HTML after it passes validation.
5. Never return invalid or unvalidated HTML.

ADDITIONAL ANSWER QUALITY RULES:
- Provide useful, actionable guidance: include clear step-by-step instructions, checklists, examples, common pitfalls, and approximate timelines or required documents when applicable.
- Do NOT satisfy a user's query with a single generic sentence such as "consult a legal expert". If a topic is jurisdiction-sensitive (legal, tax, or regulated advice), clearly label which parts depend on jurisdiction and provide practical next steps (e.g., authoritative resources, sample questions to ask a professional, templates or forms to look for, and specific examples of additional documentation or approvals that may be required) rather than an empty disclaimer.
- Prioritize clarity and usefulness: prefer numbered steps, short examples, and concrete actions over vague high-level statements.
- If you cannot provide specific guidance for legal or medical compliance reasons, offer concrete alternative actions (research steps, official sources, or preparatory tasks).
- Ensure subheadings and sections are logically grouped and relevant.

MICRODATA FORMAT EXAMPLE:
<article itemscope itemtype="https://schema.org/Article">
  <h1 itemprop="headline">Title</h1>
  <div itemprop="articleBody">
    <p>Content...</p>
  </div>
  <span itemprop="author" itemscope itemtype="https://schema.org/Person">
    <meta itemprop="name" content="Author Name">
  </span>
</article>

For FAQ content, use FAQPage schema:
<div itemscope itemtype="https://schema.org/FAQPage">
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">Question text?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Answer text.</p>
    </div>
  </div>
</div>`;

export const ARTICLE_USER_PROMPT_TEMPLATE = `Generate a comprehensive, high-quality HTML article about "{topic_label}".

Cover the following key points:
{topic_bullets}

ORGANIZATION GUIDELINES:
- Do NOT convert every bullet in {topic_bullets} into a separate <h2>. Instead, group similar suggestions into logical sections and discuss the variations inside that section as needed.
- Use clear, "catchy" headings. Avoid prefixing headings with category labels.
- Use <h2> for major sections and <h3> for sub-sections when you need to separate variations or specific contexts.
 - Limit the number of top-level sections (h2) to at most 6. Prioritize the most important, actionable sections and combine less-important items into subsections (h3).
 - Avoid headings that do not specify the object of the action. Do NOT create vague or overly general headings (examples: "Common Pitfalls to Avoid", "Growing in Bottles"). Every heading must clearly state the subject it applies to. If a heading would be generic, make it specific by including the topic (for example, "Common pitfalls when selling a house" or "Growing tomatoes in bottles").
 - Ensure that subheadings (h3) are directly relevant to their parent h2 heading. If a subheading doesn't logically fit under the main section, regroup content or rename sections to maintain coherence. Avoid mixing conventional and unconventional methods under the same heading unless clearly differentiated.  

REQUIREMENTS:
1. Output MUST be valid HTML (no markdown, no code fences).
2. Use schema.org microdata attributes (itemscope, itemtype, itemprop) embedded directly in HTML elements.
3. Structure:
   - Main <article> or <div> with itemscope itemtype="https://schema.org/Article" (or FAQPage if Q&A format fits better)
   - <h1> with itemprop="headline" for the main title
   - <h2> headings for major sections
   - Content wrapped with itemprop="articleBody"
   - Include author info with itemprop="author"
4. After generating, call the validate_microdata tool with your HTML to verify it's valid.
5. Only provide the final response after validation passes.

Generate the article now, then validate it.`;

export enum VALIDATION_MESSAGE {
  MissingItemscope = 'Missing itemscope attribute. At least one element must have itemscope.',
  MissingItemtype = 'Missing itemtype attribute. itemscope elements should have itemtype.',
  MissingItemprop = 'Missing itemprop attributes. Properties should be marked with itemprop.',
  InvalidItemtype = 'itemtype must use schema.org URLs (e.g., https://schema.org/Article)',
  ArticleMissingHeadline = 'Article schema should have itemprop="headline"',
  ArticleMissingArticleBody = 'Article schema should have itemprop="articleBody"',
  FaqPageMissingMainEntity = 'FAQPage schema must have itemprop="mainEntity" for questions',
  QuestionMissingName = 'Question schema should have itemprop="name" for the question text',
  QuestionMissingAcceptedAnswer = 'Question schema should have itemprop="acceptedAnswer"',
  ConsiderHeadlineOnH1 = 'Consider adding itemprop="headline" to your h1 element',
  ItemscopeWithoutType = 'Found itemscope without itemtype - consider adding itemtype for better semantics',
}

export const VALIDATE_MICRODATA_TOOL = {
  type: 'function' as const,
  function: {
    name: 'validate_microdata',
    description:
      'Validates HTML content for proper schema.org microdata markup. Returns validation result with any errors found. You MUST call this tool after generating HTML to ensure the microdata is valid.',
    parameters: {
      type: 'object',
      properties: {
        html: {
          type: 'string',
          description: 'The HTML content to validate for microdata markup',
        },
      },
      required: ['html'],
    },
  },
};
