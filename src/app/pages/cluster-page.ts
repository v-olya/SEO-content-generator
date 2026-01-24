import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { ClusterApiService } from '../services/cluster-api.service';
import { ClusterDetailResponse } from '../types';

@Component({
  selector: 'app-cluster-page',
  imports: [RouterLink, ButtonModule, CardModule, ChipModule, MessageModule, TagModule],
  templateUrl: './cluster-page.html',
  styleUrl: './cluster-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'page'
  }
})
export class ClusterPage {
  private readonly api = inject(ClusterApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly document = inject(DOCUMENT);

  private readonly loading = signal(true);
  private readonly errorMessage = signal<string | null>(null);
  private readonly response = signal<ClusterDetailResponse | null>(null);

  protected readonly isBusy = computed(() => this.loading());
  protected readonly error = computed(() => this.errorMessage());
  protected readonly detail = computed(() => this.response());

  constructor() {
    const slug = this.route.snapshot.paramMap.get('slug');
    const jobId = this.getJobId(slug);

    if (!jobId || !slug) {
      this.errorMessage.set('Missing cluster identifier.');
      this.loading.set(false);
      return;
    }

    this.api.getClusterDetail(jobId, slug).subscribe({
      next: (result) => {
        this.response.set(result);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('We could not load this cluster.');
        this.loading.set(false);
      }
    });
  }

  private getJobId(slug: string | null) {
    const state = this.document.defaultView?.history.state as { jobId?: string } | null;
    const stateJobId = state?.jobId;
    if (typeof stateJobId === 'string' && stateJobId.length > 0) {
      return stateJobId;
    }

    if (!slug) {
      return null;
    }

    return sessionStorage.getItem(`cluster-job:${slug}`);
  }
}
