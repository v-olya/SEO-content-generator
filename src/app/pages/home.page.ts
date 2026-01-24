import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { ClusterApiService } from '../services/cluster-api.service';
import { ClusterResponse } from '../types';

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
    TagModule
  ],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'page'
  }
})
export class HomePage {
  private readonly api = inject(ClusterApiService);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly form = this.formBuilder.group({
    query: ['', [Validators.required, Validators.minLength(2)]]
  });

  private readonly loading = signal(false);
  private readonly errorMessage = signal<string | null>(null);
  private readonly response = signal<ClusterResponse | null>(null);

  protected readonly isBusy = computed(() => this.loading());
  protected readonly error = computed(() => this.errorMessage());
  protected readonly result = computed(() => this.response());

  constructor() {
    const stored = this.readStoredResponse();
    if (stored) {
      this.response.set(stored);
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

    this.api.clusterQuery(query).subscribe({
      next: (result) => {
        this.response.set(result);
        this.storeResponse(result);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.errorMessage.set(this.toErrorMessage(error));
        this.loading.set(false);
      }
    });
  }

  openCluster(jobId: string, slug: string) {
    sessionStorage.setItem(this.getJobKey(slug), jobId);
    void this.router.navigate(['/', slug], {
      state: { jobId }
    });
  }

  private getJobKey(slug: string) {
    return `cluster-job:${slug}`;
  }

  private storeResponse(response: ClusterResponse) {
    sessionStorage.setItem('cluster-response', JSON.stringify(response));
  }

  private readStoredResponse() {
    const raw = sessionStorage.getItem('cluster-response');
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as ClusterResponse;
    } catch {
      return null;
    }
  }

  private toErrorMessage(error: unknown) {
    if (error instanceof HttpErrorResponse) {
      const message = error.error?.message;
      if (typeof message === 'string' && message.trim().length > 0) {
        return message;
      }
    }

    return 'We could not reach the clustering service.';
  }
}
