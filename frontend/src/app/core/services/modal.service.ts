import { Injectable, signal, TemplateRef } from '@angular/core';

export interface ModalButton {
	label: string;
	class?: string; // Bootstrap modifier e.g. 'btn-danger', 'btn-primary'
}

export interface ModalState {
	template: TemplateRef<any> | null;
	message: string | null;
	buttons: ModalButton[];
	resolve: (button: string | null) => void;
}

@Injectable({ providedIn: 'root' })
export class ModalService {
	readonly state = signal<ModalState | null>(null);

	/** Open a modal with a custom template. Resolves with the label of the button pressed, or null if dismissed. */
	open(template: TemplateRef<any>, buttons: ModalButton[]): Promise<string | null> {
		return new Promise((resolve) => {
			this.state.set({ template, message: null, buttons, resolve });
		});
	}

	/** Open a simple confirmation modal. Resolves true when the confirm button is pressed. */
	confirm(message: string, confirmLabel = 'Confirm', cancelLabel = 'Cancel'): Promise<boolean> {
		return new Promise((resolve) => {
			this.state.set({
				template: null,
				message,
				buttons: [
					{ label: cancelLabel, class: 'btn-secondary' },
					{ label: confirmLabel, class: 'btn-danger' }
				],
				resolve: (btn) => resolve(btn === confirmLabel)
			});
		});
	}

	/** Close the modal and resolve with the given button label. */
	close(button: string | null = null): void {
		const s = this.state();
		if (!s) return;
		this.state.set(null);
		s.resolve(button);
	}
}
