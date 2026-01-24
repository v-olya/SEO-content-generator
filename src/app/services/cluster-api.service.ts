import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ClusterDetailResponse, ClusterResponse } from '../types';
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
}
