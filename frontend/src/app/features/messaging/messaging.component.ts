import { Component, computed, inject, input, InputSignal, Signal, signal, WritableSignal } from '@angular/core';
import { Router } from '@angular/router';
import { Message, MessageService, SendMessageRequest } from '../../core/services/message.service';
import { ToastService } from '../../core/services/toast.service';
import { ComposeComponent } from './message-compose/message-compose.component';
import { MessageDetailsComponent } from './message-details/message-details.component';
import { MessageListComponent } from './message-list/message-list.component';

enum Tab {
	INBOX = 'inbox',
	SENT = 'sent',
	COMPOSE = 'compose'
}

@Component({
	selector: 'app-messaging',
	templateUrl: './messaging.component.html',
	standalone: true,
	imports: [MessageDetailsComponent, MessageListComponent, ComposeComponent]
})
export class MessagingComponent {
	public messagesData: InputSignal<{ sent: Message[]; inbox: Message[] }> = input({
		sent: [] as Message[],
		inbox: [] as Message[]
	});

	private readonly toastService: ToastService = inject(ToastService);

	public activeTab: WritableSignal<Tab> = signal(Tab.INBOX);
	public inbox: Signal<Message[]> = computed(() => this.messagesData().inbox);
	public sent: Signal<Message[]> = computed(() => this.messagesData().sent);
	public unreadCount: Signal<number> = computed(() => this.inbox().filter((m) => !m.is_read).length);
	public selectedMessage: WritableSignal<Message | null> = signal(null);
	public Tab: typeof Tab = Tab;

	constructor(
		private messageService: MessageService,
		private router: Router
	) {}

	public switchTab(tab: Tab): void {
		this.activeTab.set(tab);
		this.selectedMessage.set(null);
		if (tab === Tab.INBOX) {
			this.router.navigate([], { onSameUrlNavigation: 'reload', replaceUrl: true });
		}
	}

	public markAsRead(msg: Message): void {
		if (!msg.is_read && this.activeTab() === Tab.INBOX) {
			this.messageService.markAsRead(msg.id).subscribe({
				next: () => this.router.navigate([], { onSameUrlNavigation: 'reload', replaceUrl: true }),
				error: () => this.toastService.error('Failed to mark as read')
			});
		}
	}

	public deleteMessage(msg: Message): void {
		if (!confirm('Delete this message?')) return;
		this.messageService.deleteMessage(msg.id).subscribe({
			next: () => {
				if (this.selectedMessage()?.id === msg.id) {
					this.selectedMessage.set(null);
				}
				this.router.navigate([], { onSameUrlNavigation: 'reload', replaceUrl: true });
				this.toastService.warning('Message deleted successfully');
			},
			error: (err) => this.toastService.error(err.error?.message || 'Failed to delete')
		});
	}

	public sendMessage(data: SendMessageRequest) {
		this.messageService.sendMessage(data).subscribe({
			next: () => {
				this.router.navigate([], { onSameUrlNavigation: 'reload', replaceUrl: true });
				this.toastService.success('Message sent successfully');
			},
			error: (err) => {
				this.toastService.error(err.error?.message || 'Failed to send message');
			}
		});
	}
}
