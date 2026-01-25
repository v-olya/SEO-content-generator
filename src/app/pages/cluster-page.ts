import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { retry, switchMap, timer, takeWhile, tap } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { ClusterApiService } from '../services/cluster-api.service';
import { StorageService } from '../services/storage.service';
import { ArticleJobStatus, ArticleStatusResponse, ClusterDetailResponse } from '../types';
import { ErrorMessage, UILabel, AriaLabel, StatusMessage, StorageKey } from '../constants';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-cluster-page',
  imports: [
    RouterLink,
    ButtonModule,
    CardModule,
    ChipModule,
    MessageModule,
    ProgressSpinnerModule,
    TagModule,
  ],
  templateUrl: './cluster-page.html',
  styleUrl: './cluster-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'page',
  },
})
export class ClusterPage implements OnInit {
  private readonly api = inject(ClusterApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly storage = inject(StorageService);
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly response = signal<ClusterDetailResponse | null>(null);

  // Article generation state
  protected readonly articleStatus = signal<ArticleJobStatus | null>(null);
  protected readonly articleHtml = signal<string | null>(null);
  protected readonly articleError = signal<string | null>(null);
  private articleId: string | null = null;

  // Image generation state
  protected readonly imageGenerating = signal(false);
  protected readonly imageDataUrl = signal<string | null>(null);
  protected readonly imageError = signal<string | null>(null);
  // Copy feedback state
  protected readonly copied = signal(false);

  protected readonly isGenerating = computed(() => {
    const status = this.articleStatus();
    return status === 'pending' || status === 'generating' || status === 'validating';
  });

  protected readonly isGeneratingImage = computed(() => this.imageGenerating());

  protected readonly articleStatusLabel = computed(() => {
    const status = this.articleStatus();
    switch (status) {
      case 'pending':
        return StatusMessage.ArticlePending;
      case 'generating':
        return StatusMessage.ArticleGenerating;
      case 'validating':
        return StatusMessage.ArticleValidating;
      case 'completed':
        return StatusMessage.ArticleCompleted;
      case 'failed':
        return StatusMessage.ArticleFailed;
      case 'timeout':
        return StatusMessage.ArticleTimeout;
      default:
        return '';
    }
  });

  protected readonly sanitizedHtml = computed<SafeHtml | null>(() => {
    const html = this.articleHtml();
    if (!html) return null;
    return this.sanitizer.bypassSecurityTrustHtml(html);
  });

  protected readonly UILabel = UILabel;
  protected readonly AriaLabel = AriaLabel;
  protected readonly StatusMessage = StatusMessage;

  ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug');
    const jobId = this.getJobId(slug);

    if (!jobId || !slug) {
      this.errorMessage.set(ErrorMessage.MissingClusterIdentifier);
      this.loading.set(false);
      return;
    }

    this.api
      .getClusterDetail(jobId, slug)
      .pipe(retry({ count: 2, delay: 1000 }), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.response.set(result);
          this.loading.set(false);
        },
        error: () => {
          this.errorMessage.set(ErrorMessage.ClusterLoadFailed);
          this.loading.set(false);
        },
      });
  }

  protected generateArticle(): void {
    const cluster = this.response();
    if (!cluster) return;

    this.articleStatus.set('pending');
    this.articleError.set(null);
    this.articleHtml.set(null);

    this.api
      .startArticleGeneration(cluster.label, cluster.items)
      .pipe(
        tap((result) => {
          this.articleId = result.articleId;
          this.articleStatus.set(result.status);
        }),
        switchMap((result) =>
          timer(0, 2000).pipe(
            switchMap(() => this.api.getArticleStatus(result.articleId)),
            tap((status: ArticleStatusResponse) => {
              this.articleStatus.set(status.status);
              if (status.html) {
                this.articleHtml.set(status.html);
              }
              if (status.error) {
                this.articleError.set(status.error);
              }
            }),
            takeWhile(
              (status: ArticleStatusResponse) =>
                status.status === 'pending' ||
                status.status === 'generating' ||
                status.status === 'validating',
              true,
            ),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        error: () => {
          this.articleStatus.set('failed');
          this.articleError.set(ErrorMessage.ArticleGenerationFailed);
        },
      });
  }

  protected generateImage(): void {
    const cluster = this.response();
    if (!cluster) return;

    this.imageGenerating.set(true);
    this.imageError.set(null);

    this.api
      .generateImage(cluster.label, cluster.items)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.imageDataUrl.set(result.dataUrl);

          // Insert image with proper schema.org ImageObject microdata into the article HTML
          const alt = `Illustration for ${cluster.label}`;
          const figure = `<figure itemscope itemtype="https://schema.org/ImageObject"><img src="${result.dataUrl}" alt="${alt}" itemprop="contentUrl" style="width: 100%; height: auto; display: block; border-radius: 8px;" /><figcaption itemprop="caption" class="visually-hidden">${alt}</figcaption><meta itemprop="width" content="1792" /><meta itemprop="height" content="1024" /></figure>`;

          const existing = this.articleHtml() || '';
          // Prepend figure to existing article HTML so it appears as hero image
          this.articleHtml.set(figure + existing);
          this.imageGenerating.set(false);
        },
        error: () => {
          this.imageError.set('Image generation failed');
          this.imageGenerating.set(false);
        },
      });
  }

  protected copyHtmlToClipboard(): void {
    const html = this.articleHtml();
    if (!html) return;
    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(html)
        .then(() => {
          this.articleError.set(null);
          this.copied.set(true);
          // auto-hide after 2 seconds
          setTimeout(() => this.copied.set(false), 2000);
        })
        .catch(() => {
          this.articleError.set('Failed to copy HTML to clipboard');
        });
    } else {
      this.articleError.set('Clipboard API not available');
    }
  }

  private getJobId(slug: string | null): string | null {
    const state = this.document.defaultView?.history.state as { jobId?: string } | null;
    const stateJobId = state?.jobId;
    if (typeof stateJobId === 'string' && stateJobId.length > 0) {
      return stateJobId;
    }

    if (!slug) {
      return null;
    }

    return this.storage.getItem<string>(`${StorageKey.ClusterJobPrefix}:${slug}`);
  }
}
