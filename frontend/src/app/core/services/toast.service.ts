import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning';

export interface Toast {
	id: number;
	message: string;
	type: ToastType;
	dismissing: boolean;
}

const DISMISS_ANIMATION_MS = 350;

@Injectable({ providedIn: 'root' })
export class ToastService {
	private nextId = 0;
	readonly toasts = signal<Toast[]>([]);

	success(message: string): void {
		this.add(message, 'success');
	}

	error(message: string): void {
		this.add(message, 'error');
	}

	warning(message: string): void {
		this.add(message, 'warning');
	}

	dismiss(id: number): void {
		// Skip if already being dismissed
		const toast = this.toasts().find((t) => t.id === id);
		if (!toast || toast.dismissing) return;

		// Mark as dismissing to trigger exit animation
		this.toasts.update((toasts) => toasts.map((t) => (t.id === id ? { ...t, dismissing: true } : t)));

		// Remove from DOM after animation completes
		setTimeout(() => {
			this.toasts.update((toasts) => toasts.filter((t) => t.id !== id));
		}, DISMISS_ANIMATION_MS);
	}

	private add(message: string, type: ToastType): void {
		const id = this.nextId++;
		this.toasts.update((toasts) => [...toasts, { id, message, type, dismissing: false }]);
		setTimeout(() => this.dismiss(id), 4000);
	}
}
