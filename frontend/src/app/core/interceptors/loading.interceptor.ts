import { HttpContextToken, HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';

export const SKIP_LOADING = new HttpContextToken<boolean>(() => false);

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
	constructor(private loadingService: LoadingService) {}

	intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
		if (request.context.get(SKIP_LOADING)) {
			return next.handle(request);
		}
		this.loadingService.increment();
		return next.handle(request).pipe(finalize(() => this.loadingService.decrement()));
	}
}
