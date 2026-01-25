import { ErrorHandler, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorMessage } from '../constants';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  readonly error = signal<string | null>(null);

  handleError(error: Error | HttpErrorResponse): void {
    console.error('Unhandled error:', error);

    if (error instanceof HttpErrorResponse) {
      this.error.set(ErrorMessage.NetworkError);
    } else {
      this.error.set(ErrorMessage.UnexpectedError);
    }

    // Auto-clear after 10 seconds
    setTimeout(() => this.error.set(null), 10000);
  }
}
