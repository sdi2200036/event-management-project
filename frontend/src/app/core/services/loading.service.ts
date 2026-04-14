import { Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { EventType, Router } from '@angular/router';
import { BehaviorSubject, debounceTime } from 'rxjs';

@Injectable({
	providedIn: 'root'
})
export class LoadingService {
	private _loading: WritableSignal<boolean> = signal(false);
	public loading: Signal<boolean> = this._loading.asReadonly();

	private counter: BehaviorSubject<number> = new BehaviorSubject(0);

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

		this.counter.pipe(debounceTime(100)).subscribe((count) => {
			this._loading.set(count > 0);
		});
	}

	public increment(): void {
		this.counter.next(this.counter.value + 1);
	}

	public decrement(): void {
		this.counter.next(Math.max(0, this.counter.value - 1));
	}
}
