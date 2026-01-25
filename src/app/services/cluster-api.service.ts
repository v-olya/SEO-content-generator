import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  ArticleStatusResponse,
  ClusterDetailResponse,
  ClusterResponse,
  StartArticleResponse,
} from '../types';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ClusterApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  clusterQuery(query: string) {
    return this.http.post<ClusterResponse>(`${this.baseUrl}/cluster`, { query });
  }

  getClusterDetail(jobId: string, slug: string) {
    return this.http.get<ClusterDetailResponse>(`${this.baseUrl}/cluster/${jobId}/${slug}`);
  }

  startArticleGeneration(jobId: string, slug: string) {
    return this.http.post<StartArticleResponse>(`${this.baseUrl}/article/generate`, {
      jobId,
      slug,
    });
  }

  getArticleStatus(articleId: string) {
    return this.http.get<ArticleStatusResponse>(`${this.baseUrl}/article/status/${articleId}`);
  }
}
