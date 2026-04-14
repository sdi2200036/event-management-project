import { DatePipe } from '@angular/common';
import { Component, input, InputSignal, model, ModelSignal, output, OutputEmitterRef } from '@angular/core';
import { Message } from 'src/app/core/services/message.service';

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
	public readMessage: OutputEmitterRef<Message> = output<Message>();

	public onOpenMessage(message: Message): void {
		if (!message.is_read) {
			this.readMessage.emit(message);
		}
		this.selectedMessage.set(message);
	}
}
