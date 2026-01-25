import { ChangeDetectionStrategy, Component, ErrorHandler, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MessageModule } from 'primeng/message';
import { GlobalErrorHandler } from './services/global-error-handler.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MessageModule],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'app-root',
  },
})
export class App {
  protected readonly errorHandler = inject(ErrorHandler) as GlobalErrorHandler;
}
