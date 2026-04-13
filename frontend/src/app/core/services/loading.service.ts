import { Injectable, signal, WritableSignal } from '@angular/core';
import { EventType, Router } from '@angular/router';

@Injectable({
	providedIn: 'root'
})
export class LoadingService {
	private _loading: WritableSignal<boolean> = signal(false);
	public loading = this._loading.asReadonly();

	private counter: WritableSignal<number> = signal(0);

	constructor(router: Router) {
		router.events.subscribe((e) => {
			if (e.type === EventType.NavigationStart) {
				this.increment();
			} else if (
				e.type === EventType.NavigationEnd ||
				e.type === EventType.NavigationCancel ||
				e.type === EventType.NavigationError
			) {
				this.decrement();
			}
		});
	}

	public setLoading(isLoading: boolean): void {
		this._loading.set(isLoading);
	}

	public increment(): void {
		this.counter.update((c) => c + 1);
		this._loading.set(true);
	}

	public decrement(): void {
		this.counter.update((c) => Math.max(0, c - 1));
		if (this.counter() === 0) {
			this._loading.set(false);
		}
	}
}
