import { DatePipe } from '@angular/common';
import {
	Component,
	computed,
	input,
	InputSignal,
	model,
	ModelSignal,
	output,
	OutputEmitterRef,
	Signal
} from '@angular/core';
import { Message, PAGE_SIZE } from 'src/app/core/services/message.service';

@Component({
	selector: 'app-message-list',
	imports: [DatePipe],
	templateUrl: './message-list.component.html',
	styleUrl: './message-list.component.css'
})
export class MessageListComponent {
	public selectedMessage: ModelSignal<Message | null> = model<Message | null>(null);
	public messages: InputSignal<Message[]> = input.required<Message[]>();
	public highlightUnread: InputSignal<boolean> = input(false);
	public totalItems: InputSignal<number> = input(0);
	public currentPage: InputSignal<number> = input(1);

	public readMessage: OutputEmitterRef<Message> = output<Message>();
	public pageChange: OutputEmitterRef<number> = output<number>();

	public readonly totalPages: Signal<number> = computed(() => Math.max(1, Math.ceil(this.totalItems() / PAGE_SIZE)));

	public readonly pageNumbers: Signal<number[]> = computed(() =>
		Array.from({ length: this.totalPages() }, (_, i) => i + 1)
	);

	public onOpenMessage(message: Message): void {
		if (!message.is_read) {
			this.readMessage.emit(message);
		}
		this.selectedMessage.set(message);
	}

	public goToPage(page: number): void {
		if (page >= 1 && page <= this.totalPages()) {
			this.pageChange.emit(page);
		}
	}
}
