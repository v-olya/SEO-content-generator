import { effect, ErrorHandler, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorMessage } from '../constants';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  readonly error = signal<string | null>(null);

  constructor() {
    // Auto-clear error after 10 seconds:
    // effectre-runs when error changes, and cancels pending timeouts
    effect((onCleanup) => {
      const currentError = this.error();
      if (currentError) {
        const timeoutId = setTimeout(() => this.error.set(null), 10000);
        onCleanup(() => clearTimeout(timeoutId));
      }
    });
  }

  handleError(error: Error | HttpErrorResponse): void {
    console.error('Unhandled error:', error);

    if (error instanceof HttpErrorResponse) {
      this.error.set(ErrorMessage.NetworkError);
    } else {
      this.error.set(ErrorMessage.UnexpectedError);
    }
  }
}
