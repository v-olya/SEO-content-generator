import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import {
  ARTICLE_JOB_TIMEOUT_MS,
  ARTICLE_SYSTEM_PROMPT,
  ARTICLE_USER_PROMPT_TEMPLATE,
  ARTICLE_VALIDATION_REMINDER_PROMPT,
  ERROR_MESSAGE,
  LLM_MODELS,
  VALIDATE_MICRODATA_TOOL,
  VALIDATION_MESSAGE,
} from '../constants';
import {
  ArticleGenerationJob,
  ArticleStatusResponse,
  MicrodataValidationResult,
  StartArticleResponse,
} from '../../../shared/cluster.types';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

interface OpenAIResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
      tool_calls?: ToolCall[];
    };
    finish_reason?: string;
  }>;
}

@Injectable()
export class ArticleService {
  private readonly logger = new Logger(ArticleService.name);
  private readonly jobs = new Map<string, ArticleGenerationJob>();

  constructor(private readonly configService: ConfigService) {}

  async startGeneration(label: string, items: string[]): Promise<StartArticleResponse> {
    this.logger.log(`Starting article generation for label: ${label}`);

    const articleId = randomUUID();
    const job: ArticleGenerationJob = {
      articleId,
      label,
      items,
      status: 'pending',
      html: null,
      error: null,
      createdAt: Date.now(),
      completedAt: null,
    };

    this.jobs.set(articleId, job);

    // Start generation in background (non-blocking)
    this.runAgenticLoop(articleId, label, items).catch((err) => {
      const existingJob = this.jobs.get(articleId);
      if (existingJob && existingJob.status !== 'completed') {
        existingJob.status = 'failed';
        existingJob.error = err instanceof Error ? err.message : 'Unknown error';
        existingJob.completedAt = Date.now();
      }
    });

    return {
      articleId,
      status: job.status,
    };
  }

  getStatus(articleId: string): ArticleStatusResponse | null {
    const job = this.jobs.get(articleId);
    if (!job) {
      return null;
    }

    return {
      articleId: job.articleId,
      status: job.status,
      html: job.html,
      error: job.error,
    };
  }

  private async runAgenticLoop(articleId: string, label: string, items: string[]): Promise<void> {
    this.logger.log(`Starting agentic loop for articleId: ${articleId}`);

    const job = this.jobs.get(articleId);
    if (!job) {
      this.logger.error(`Job not found: ${articleId}`);
      return;
    }

    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.error('OPENAI_API_KEY not configured');
      job.status = 'failed';
      job.error = ERROR_MESSAGE.OpenAiKeyNotConfigured;
      job.completedAt = Date.now();
      return;
    }
    this.logger.log(`OPENAI_API_KEY is configured (length: ${apiKey.length})`);

    const startTime = Date.now();
    const timeout = ARTICLE_JOB_TIMEOUT_MS;

    job.status = 'generating';

    const userPrompt = ARTICLE_USER_PROMPT_TEMPLATE.replace('{topic_label}', label).replace(
      '{topic_bullets}',
      items.map((item) => `- ${item}`).join('\n'),
    );

    const messages: ChatMessage[] = [
      { role: 'system', content: ARTICLE_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ];

    const maxIterations = 5;

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      this.logger.log(`Iteration ${iteration + 1}/${maxIterations}`);

      // Check timeout
      if (Date.now() - startTime > timeout) {
        this.logger.warn(`Timeout reached after ${Date.now() - startTime}ms`);
        job.status = 'timeout';
        job.error = ERROR_MESSAGE.ArticleGenerationTimeout;
        job.completedAt = Date.now();
        return;
      }

      const response = await this.callOpenAI(apiKey, messages);
      if (!response) {
        this.logger.error('Failed to get response from OpenAI');
        job.status = 'failed';
        job.error = ERROR_MESSAGE.FailedToGetOpenAiResponse;
        job.completedAt = Date.now();
        return;
      }

      const choice = response.choices?.[0];
      const assistantMessage = choice?.message;
      const finishReason = choice?.finish_reason;

      this.logger.log(`Finish reason: ${finishReason}`);

      if (!assistantMessage) {
        this.logger.error('Empty response from OpenAI');
        job.status = 'failed';
        job.error = ERROR_MESSAGE.EmptyOpenAiResponse;
        job.completedAt = Date.now();
        return;
      }

      // Add assistant message to conversation
      messages.push({
        role: 'assistant',
        content: assistantMessage.content ?? '',
        tool_calls: assistantMessage.tool_calls,
      });

      // Check if model wants to call a tool
      if (finishReason === 'tool_calls' && assistantMessage.tool_calls?.length) {
        this.logger.log(
          `Tool calls requested: ${assistantMessage.tool_calls.map((t) => t.function.name).join(', ')}`,
        );
        job.status = 'validating';

        for (const toolCall of assistantMessage.tool_calls) {
          if (toolCall.function.name === 'validate_microdata') {
            const args = JSON.parse(toolCall.function.arguments) as { html: string };
            const validationResult = this.validateMicrodata(args.html);

            this.logger.log(
              `Validation result: valid=${validationResult.valid}, errors=${validationResult.errors.length}, warnings=${validationResult.warnings.length}`,
            );

            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(validationResult),
            });

            // If valid, we can use this HTML as the final result
            if (validationResult.valid) {
              this.logger.log(`Article generation completed successfully`);
              job.status = 'completed';
              job.html = this.stripImgTags(args.html); // Angular's DOM sanitizer won't strip IMGs (if any) when we add innerHTML
              job.completedAt = Date.now();
              return;
            }

            this.logger.log(`Validation failed, continuing to next iteration`);
            // Continue loop to let model fix issues
            job.status = 'generating';
          }
        }
      } else if (finishReason === 'stop' && assistantMessage.content) {
        this.logger.warn(`Model returned content without validating, reminding to use tool`);
        // Model returned content without validating - remind it to validate
        messages.push({
          role: 'user',
          content: ARTICLE_VALIDATION_REMINDER_PROMPT,
        });
      } else {
        // Unexpected finish reason
        this.logger.error(`Unexpected finish reason: ${finishReason}`);
        job.status = 'failed';
        job.error = ERROR_MESSAGE.UnexpectedFinishReasonTemplate.replace(
          '{reason}',
          finishReason || 'unknown',
        );
        job.completedAt = Date.now();
        return;
      }
    }

    // Max iterations reached without valid result
    this.logger.error('Max iterations reached without valid result');
    job.status = 'failed';
    job.error = ERROR_MESSAGE.MaxIterationsReached;
    job.completedAt = Date.now();
  }

  private async callOpenAI(
    apiKey: string,
    messages: ChatMessage[],
  ): Promise<OpenAIResponse | null> {
    try {
      this.logger.log(`Calling OpenAI API with ${messages.length} messages`);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: LLM_MODELS.Gpt4oMini,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
            ...(m.tool_calls && { tool_calls: m.tool_calls }),
            ...(m.tool_call_id && { tool_call_id: m.tool_call_id }),
          })),
          tools: [VALIDATE_MICRODATA_TOOL],
          tool_choice: 'auto',
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`OpenAI API error ${response.status}: ${errorText}`);
        return null;
      }

      this.logger.log('OpenAI API call successful');
      return (await response.json()) as OpenAIResponse;
    } catch (error) {
      this.logger.error(
        `OpenAI API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return null;
    }
  }

  private validateMicrodata(html: string): MicrodataValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for basic microdata presence
    const hasItemscope = /itemscope/.test(html);
    const hasItemtype = /itemtype/.test(html);
    const hasItemprop = /itemprop/.test(html);

    if (!hasItemscope) {
      errors.push(VALIDATION_MESSAGE.MissingItemscope);
    }

    if (!hasItemtype) {
      errors.push(VALIDATION_MESSAGE.MissingItemtype);
    }

    if (!hasItemprop) {
      errors.push(VALIDATION_MESSAGE.MissingItemprop);
    }

    // Check for schema.org types
    const schemaOrgPattern = /itemtype=["']https?:\/\/schema\.org\/(\w+)["']/g;
    const schemaTypes: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = schemaOrgPattern.exec(html)) !== null) {
      schemaTypes.push(match[1]);
    }

    if (hasItemtype && schemaTypes.length === 0) {
      errors.push(VALIDATION_MESSAGE.InvalidItemtype);
    }

    // Validate known schema types have required properties
    if (schemaTypes.includes('Article')) {
      if (!/itemprop=["']headline["']/.test(html)) {
        warnings.push(VALIDATION_MESSAGE.ArticleMissingHeadline);
      }
      if (!/itemprop=["']articleBody["']/.test(html)) {
        warnings.push(VALIDATION_MESSAGE.ArticleMissingArticleBody);
      }
    }

    if (schemaTypes.includes('FAQPage')) {
      if (!/itemprop=["']mainEntity["']/.test(html)) {
        errors.push(VALIDATION_MESSAGE.FaqPageMissingMainEntity);
      }
    }

    if (schemaTypes.includes('Question')) {
      if (!/itemprop=["']name["']/.test(html)) {
        warnings.push(VALIDATION_MESSAGE.QuestionMissingName);
      }
      if (!/itemprop=["']acceptedAnswer["']/.test(html)) {
        warnings.push(VALIDATION_MESSAGE.QuestionMissingAcceptedAnswer);
      }
    }

    // Check for common HTML structure issues
    if (
      /<h1[^>]*>/.test(html) &&
      !/itemprop=["']headline["']/.test(html) &&
      schemaTypes.includes('Article')
    ) {
      warnings.push(VALIDATION_MESSAGE.ConsiderHeadlineOnH1);
    }

    // Check for itemscope without itemtype
    const itemscopeWithoutType = /<[^>]+itemscope(?![^>]*itemtype)[^>]*>/g;
    if (itemscopeWithoutType.test(html)) {
      warnings.push(VALIDATION_MESSAGE.ItemscopeWithoutType);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private stripImgTags(html: string): string {
    return html.replace(/<img[^>]*>/gi, '');
  }
}
