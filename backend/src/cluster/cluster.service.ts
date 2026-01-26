import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { createResponseSchema } from './schema';
import {
  LLM_MAX_RETRIES,
  LLM_MODELS,
  ERROR_MESSAGE,
  SuggestionEndpoints,
  CLUSTERING_PROMPT_TEMPLATE,
} from '../constants';
import {
  ClusterDetailResponse,
  ClusterGroup,
  ClusterJob,
  ClusterResponse,
  Orphan,
} from '../../../shared/cluster.types';

@Injectable()
export class ClusterService {
  private readonly logger = new Logger(ClusterService.name);
  private readonly jobs = new Map<string, ClusterJob>();

  constructor(private readonly configService: ConfigService) {}

  async createJob(query: string): Promise<ClusterResponse> {
    const trimmed = query?.trim();
    if (!trimmed) {
      throw new BadRequestException(ERROR_MESSAGE.QueryRequired);
    }

    this.logger.log(`Creating job for query: "${trimmed}"`);

    const suggestions = await this.fetchSuggestions(trimmed);
    const uniqueQueries = Array.from(new Set(suggestions));
    this.logger.log(`Fetched ${uniqueQueries.length} unique suggestions`);

    const llmResult = await this.clusterWithLLM(uniqueQueries);
    if (!llmResult) {
      this.logger.error('LLM clustering failed - no result returned');
      throw new ServiceUnavailableException(ERROR_MESSAGE.LlmUnavailable);
    }

    const { clusters, orphans } = llmResult;

    const jobId = randomUUID();
    const job: ClusterJob = {
      jobId,
      clusters,
      orphans,
      createdAt: Date.now(),
    };

    this.jobs.set(jobId, job);

    return {
      jobId,
      clusters,
      orphans,
    };
  }

  getClusterDetail(jobId: string, slug: string): ClusterDetailResponse | null {
    const job = this.jobs.get(jobId);
    if (!job) {
      return null;
    }

    const cluster = job.clusters.find((item: ClusterGroup) => item.slug === slug);
    if (cluster) {
      return {
        jobId,
        slug,
        label: cluster.label,
        items: cluster.items,
        type: 'cluster',
      };
    }

    const orphan = job.orphans.find((item: Orphan) => item.slug === slug);
    if (orphan) {
      return {
        jobId,
        slug,
        label: orphan.label,
        items: [orphan.item],
        type: 'orphan',
      };
    }

    return null;
  }

  private async fetchSuggestions(query: string): Promise<string[]> {
    const encoded = encodeURIComponent(query);
    const endpoints = [
      `${SuggestionEndpoints.Bing}${encoded}`,
      `${SuggestionEndpoints.Google}${encoded}`,
      `${SuggestionEndpoints.YouTube}${encoded}`,
    ];

    const responses = await Promise.allSettled(
      endpoints.map(async (url) => {
        const response = await fetch(url);
        if (!response.ok) {
          return [] as string[];
        }
        const data = (await response.json()) as unknown;
        if (Array.isArray(data) && Array.isArray(data[1])) {
          return data[1].filter((item): item is string => typeof item === 'string');
        }
        return [] as string[];
      }),
    );

    return responses
      .flatMap((result) => (result.status === 'fulfilled' ? result.value : []))
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  private async clusterWithLLM(queries: string[]) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.error('OPENAI_API_KEY not configured');
      return null;
    }
    this.logger.log(`OPENAI_API_KEY is configured (length: ${apiKey.length})`);

    const model = LLM_MODELS.Gpt4oMini;
    this.logger.log(`Using model: ${model}`);
    const prompt = {
      role: 'user',
      content: CLUSTERING_PROMPT_TEMPLATE.replace('{queries}', JSON.stringify(queries)),
    };

    const maxAttempts = LLM_MAX_RETRIES;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [prompt],
          temperature: 0.2,
        }),
      });

      if (response.ok) {
        this.logger.log(`Attempt ${attempt}: Response OK`);
        const payload = (await response.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };

        const content = payload.choices?.[0]?.message?.content;
        if (content) {
          const validated = this.validateLLMResponseSchema(content, queries);
          if (validated) {
            this.logger.log(
              `Successfully validated LLM response: ${validated.clusters.length} clusters, ${validated.orphans.length} orphans`,
            );
            return this.buildGroups(validated.clusters, validated.orphans, queries);
          }

          this.logger.warn(`Attempt ${attempt}: LLM response failed validation; will retry`);
        } else {
          this.logger.warn(`Attempt ${attempt}: No content in response`);
        }
      } else {
        const errorText = await response.text();
        this.logger.error(`Attempt ${attempt}: API error ${response.status}: ${errorText}`);
      }

      if (attempt < maxAttempts) {
        const delay = 300 * Math.pow(2, attempt - 1);
        this.logger.log(`Retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }

    this.logger.error(`All ${maxAttempts} attempts failed`);
    return null;
  }

  private buildGroups(
    clusters: Array<{ label: string; items: string[] }>,
    orphans: string[],
    original: string[],
  ) {
    const allowed = new Set(original);
    const cleanedClusters: ClusterGroup[] = clusters
      .map((cluster) => {
        const items = cluster.items.filter((item) => allowed.has(item));
        return {
          id: randomUUID(),
          label: cluster.label.trim() || 'Cluster',
          slug: this.slugify(cluster.label || 'cluster'),
          items,
        };
      })
      .filter((cluster) => cluster.items.length > 1);

    const cleanedOrphans = orphans
      .filter((item) => allowed.has(item))
      .map((item) => ({
        id: randomUUID(),
        label: item,
        slug: this.slugify(item),
        item,
      }));

    const used = new Set(cleanedClusters.flatMap((cluster) => cluster.items));
    for (const orphan of cleanedOrphans) {
      used.add(orphan.item);
    }

    for (const item of original) {
      if (!used.has(item)) {
        cleanedOrphans.push({
          id: randomUUID(),
          label: item,
          slug: this.slugify(item),
          item,
        });
      }
    }

    return { clusters: cleanedClusters, orphans: cleanedOrphans };
  }

  private validateLLMResponseSchema(rawContent: string, original: string[]) {
    // Use zod for schema validation. We allow extracting a JSON object from surrounding text.
    const tryParse = (text: string): unknown | null => {
      try {
        return JSON.parse(text);
      } catch {
        return null;
      }
    };

    let parsed = tryParse(rawContent) as unknown | null;
    if (!parsed) {
      const match = rawContent.match(/(\{[\s\S]*\})/);
      if (match) parsed = tryParse(match[1]);
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;

    // Use schema from dedicated module (creates a schema closed over `original`).
    const ResponseSchema = createResponseSchema(original);
    const result = ResponseSchema.safeParse(parsed);
    if (!result.success) {
      this.logger.warn('LLM response did not match schema', result.error.format());
      return null;
    }

    return { clusters: result.data.clusters, orphans: result.data.orphans };
  }

  private slugify(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 80);
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
