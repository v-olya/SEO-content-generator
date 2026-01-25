import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { retry } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ClusterApiService } from '../services/cluster-api.service';
import { StorageService } from '../services/storage.service';
import { ClusterResponse } from '../types';
import {
  ErrorMessage,
  UILabel,
  UIPlaceholder,
  AriaLabel,
  StatusMessage,
  ValidationMessage,
  CLUSTER_COLORS,
  StorageKey,
} from '../constants';

@Component({
  selector: 'app-home-page',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    DividerModule,
    InputTextModule,
    MessageModule,
    ProgressSpinnerModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'page',
  },
})
export class HomePage {
  private readonly api = inject(ClusterApiService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly storage = inject(StorageService);

  protected readonly form = new FormGroup({
    query: new FormControl('', [Validators.required, Validators.minLength(3)]),
  });

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly response = signal<ClusterResponse | null>(null);

  protected get queryControl() {
    return this.form.controls.query;
  }

  protected readonly UILabel = UILabel;
  protected readonly UIPlaceholder = UIPlaceholder;
  protected readonly AriaLabel = AriaLabel;
  protected readonly StatusMessage = StatusMessage;
  protected readonly ValidationMessage = ValidationMessage;

  constructor() {
    const storedResponse = this.storage.getItem<ClusterResponse>(StorageKey.ClusterResponse);
    if (storedResponse) {
      this.response.set(storedResponse);
    }
    const storedQuery = this.storage.getItem<string>(StorageKey.ClusterQuery);
    if (storedQuery) {
      this.form.controls.query.setValue(storedQuery);
    }
  }

  submit() {
    if (this.form.invalid || this.loading()) {
      return;
    }

    const query = this.form.get('query')?.value?.trim();
    if (!query) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.response.set(null);

    this.api
      .clusterQuery(query)
      .pipe(retry({ count: 2, delay: 1000 }), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.response.set(result);
          this.storeResponse(result);
          this.storage.setItem(StorageKey.ClusterQuery, query);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.errorMessage.set(this.toErrorMessage(error));
          this.loading.set(false);
        },
      });
  }

  onQueryBlur() {
    const currentQuery = this.form.controls.query.value?.trim();
    const storedQuery = this.storage.getItem<string>(StorageKey.ClusterQuery);
    if (storedQuery && currentQuery !== storedQuery) {
      this.response.set(null);
      this.storage.removeItem(StorageKey.ClusterResponse);
      this.storage.removeItem(StorageKey.ClusterQuery);
      // Remove all cluster-job:* keys
      const keys = Object.keys(sessionStorage);
      keys.forEach((key) => {
        if (key.startsWith(StorageKey.ClusterJobPrefix + ':')) {
          this.storage.removeItem(key);
        }
      });
    }
  }

  openCluster(jobId: string, slug: string) {
    this.storage.setItem(this.getJobKey(slug), jobId);
    void this.router.navigate(['/', slug], {
      state: { jobId },
    });
  }

  formatClusterItems(items: string[]) {
    if (items.length === 0) {
      return ErrorMessage.NoItemsFound;
    }

    return items.join('\n');
  }

  getClusterColor(index: number) {
    return CLUSTER_COLORS[index % CLUSTER_COLORS.length];
  }

  private getJobKey(slug: string) {
    return `${StorageKey.ClusterJobPrefix}:${slug}`;
  }

  private storeResponse(response: ClusterResponse) {
    this.storage.setItem(StorageKey.ClusterResponse, response);
  }

  private toErrorMessage(error: unknown) {
    if (error instanceof HttpErrorResponse) {
      const message = error.error?.message;
      if (typeof message === 'string' && message.trim().length > 0) {
        return message;
      }
    }

    return ErrorMessage.ClusterServiceUnavailable;
  }
}
