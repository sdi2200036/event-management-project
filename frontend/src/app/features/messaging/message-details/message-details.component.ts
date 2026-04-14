import { DatePipe } from '@angular/common';
import { Component, input, InputSignal, output, OutputEmitterRef } from '@angular/core';
import { Message } from 'src/app/core/services/message.service';

@Component({
	selector: 'app-message-details',
	imports: [DatePipe],
	templateUrl: './message-details.component.html',
	styleUrl: './message-details.component.css'
})
export class MessageDetailsComponent {
	selectedMessage: InputSignal<Message> = input.required<Message>();
	sentMode: InputSignal<boolean> = input.required<boolean>();
	deleteMessage: OutputEmitterRef<void> = output<void>();

	public onDeleteMessage(): void {
		this.deleteMessage.emit();
	}
}
