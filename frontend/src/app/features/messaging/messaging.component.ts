import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, Signal, signal, WritableSignal } from '@angular/core';
import { form, FormField, maxLength, min, required, submit } from '@angular/forms/signals';
import { catchError, firstValueFrom, of, switchMap } from 'rxjs';
import { Message, MessageService } from '../../core/services/message.service';
import { ToastService } from '../../core/services/toast.service';

enum Tab {
	INBOX = 'inbox',
	SENT = 'sent',
	COMPOSE = 'compose'
}

@Component({
	selector: 'app-messaging',
	templateUrl: './messaging.component.html',
	standalone: true,
	imports: [DatePipe, FormField]
})
export class MessagingComponent implements OnInit {
	private readonly toastService: ToastService = inject(ToastService);

	public activeTab: WritableSignal<Tab> = signal(Tab.INBOX);
	public inbox: WritableSignal<Message[]> = signal([]);
	public sent: WritableSignal<Message[]> = signal([]);
	public unreadCount: Signal<number> = computed(() => this.inbox().filter((m) => !m.is_read).length);
	public readonly composeModel: WritableSignal<{ receiver_id: number; subject: string; body: string }> = signal({
		receiver_id: 0,
		subject: '',
		body: ''
	});
	public readonly composeForm = form(this.composeModel, (p) => {
		required(p.receiver_id);
		min(p.receiver_id, 1);
		required(p.subject);
		maxLength(p.subject, 255);
		required(p.body);
	});
	public selectedMessage: WritableSignal<Message | null> = signal(null);
	public Tab: typeof Tab = Tab;

	constructor(private messageService: MessageService) {}

	public ngOnInit(): void {
		this.loadInbox();
	}

	public loadInbox(): void {
		this.messageService.getInbox().subscribe({
			next: (msgs) => this.inbox.set(msgs),
			error: () => this.toastService.error('Failed to load inbox')
		});
	}

	public loadSent(): void {
		this.messageService.getSent().subscribe({
			next: (msgs) => this.sent.set(msgs),
			error: () => this.toastService.error('Failed to load sent messages')
		});
	}

	public switchTab(tab: Tab): void {
		this.activeTab.set(tab);
		this.selectedMessage.set(null);

		if (tab === Tab.INBOX) this.loadInbox();
		if (tab === Tab.SENT) this.loadSent();
	}

	public openMessage(msg: Message): void {
		this.selectedMessage.set(msg);
		if (!msg.is_read && this.activeTab() === Tab.INBOX) {
			this.messageService.markAsRead(msg.id).subscribe({
				next: () => (msg.is_read = true),
				error: () => this.toastService.error('Failed to mark as read')
			});
		}
	}

	public deleteMessage(msg: Message): void {
		if (!confirm('Delete this message?')) return;
		this.messageService.deleteMessage(msg.id).subscribe({
			next: () => {
				if (this.activeTab() === Tab.INBOX) {
					this.inbox.set(this.inbox().filter((m) => m.id !== msg.id));
				} else {
					this.sent.set(this.sent().filter((m) => m.id !== msg.id));
				}
				if (this.selectedMessage()?.id === msg.id) {
					this.selectedMessage.set(null);
				}
			},
			error: (err) => this.toastService.error(err.error?.message || 'Failed to delete')
		});
	}

	public async sendMessage(event: Event): Promise<void> {
		event.preventDefault();

		await submit(this.composeForm, (form) => {
			return firstValueFrom(
				this.messageService.sendMessage(form().value()).pipe(
					switchMap(() => {
						this.toastService.success('Message sent successfully');
						this.composeForm().reset({ receiver_id: 0, subject: '', body: '' });
						return of(undefined);
					}),
					catchError((err) => {
						this.toastService.error(err.error?.message || 'Failed to send message');
						return of(undefined);
					})
				)
			);
		});
	}
}
