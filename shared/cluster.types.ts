export interface ClusterJob {
  jobId: string;
  clusters: ClusterGroup[];
  orphans: Orphan[];
  createdAt: number;
}
export interface ClusterResponse {
  jobId: string;
  clusters: ClusterGroup[];
  orphans: Orphan[];
}

export interface ClusterGroup {
  id: string;
  slug: string;
  label: string;
  items: string[];
}

export interface Orphan {
  id: string;
  slug: string;
  label: string;
  item: string;
}

export interface ClusterDetailResponse {
  jobId: string;
  slug: string;
  label: string;
  items: string[];
  type: 'cluster' | 'orphan';
}

// Article generation types
export type ArticleJobStatus =
  | 'pending'
  | 'generating'
  | 'validating'
  | 'completed'
  | 'failed'
  | 'timeout';

export interface ArticleGenerationJob {
  articleId: string;
  jobId?: string;
  slug?: string;
  status: ArticleJobStatus;
  label: string;
  items: string[];
  html: string | null;
  error: string | null;
  createdAt: number;
  completedAt: number | null;
}

export interface StartArticleRequest {
  label: string;
  items: string[];
}

export interface StartArticleResponse {
  articleId: string;
  status: ArticleJobStatus;
}

export interface ArticleStatusResponse {
  articleId: string;
  status: ArticleJobStatus;
  html: string | null;
  error: string | null;
}

export interface MicrodataValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Image generation types
export interface StartImageRequest {
  label: string;
  items: string[];
}

export interface StartImageResponse {
  imageId: string;
  dataUrl: string; // data:image/png;base64,...
  prompt: string;
}
