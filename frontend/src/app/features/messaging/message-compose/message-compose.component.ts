import { Component, output, OutputEmitterRef, signal, WritableSignal } from '@angular/core';
import { form, FormField, maxLength, required, submit } from '@angular/forms/signals';
import { SendMessageRequest } from 'src/app/core/services/message.service';

@Component({
	selector: 'app-message-compose',
	imports: [FormField],
	templateUrl: './message-compose.component.html',
	styleUrl: './message-compose.component.css'
})
export class ComposeComponent {
	public sendMessage: OutputEmitterRef<SendMessageRequest> = output<SendMessageRequest>();

	public readonly composeModel: WritableSignal<{ receiver_username: string; subject: string; body: string }> = signal(
		{
			receiver_username: '',
			subject: '',
			body: ''
		}
	);
	public readonly composeForm = form(this.composeModel, (p) => {
		required(p.receiver_username);
		maxLength(p.receiver_username, 150);
		required(p.subject);
		maxLength(p.subject, 255);
		required(p.body);
	});

	constructor() {}

	public async onSendMessage(event: Event): Promise<void> {
		event.preventDefault();
		await submit(this.composeForm, (form) => {
			this.sendMessage.emit(form().value());

			this.composeForm().reset({ receiver_username: '', subject: '', body: '' });
			return Promise.resolve(undefined);
		});
	}
}
