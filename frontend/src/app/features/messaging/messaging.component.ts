import { Component, computed, input, InputSignal, linkedSignal, Signal, signal, WritableSignal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalService } from 'src/app/core/services/modal.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { MessagesResolverData } from '../../core/resolvers/messages.resolver';
import { Message, MessageService, PAGE_SIZE, SendMessageRequest } from '../../core/services/message.service';
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
	public messagesData: InputSignal<MessagesResolverData> = input.required();
	public prefillReceiver: InputSignal<string | undefined> = input<string>(undefined, { alias: 'receiver' });

	public activeTab: WritableSignal<Tab> = linkedSignal(() => {
		const receiver = this.prefillReceiver();
		return receiver ? Tab.COMPOSE : Tab.INBOX;
	});
	public unreadCount: Signal<number> = this.messageService.unreadCount;
	public selectedMessage: WritableSignal<Message | null> = signal(null);
	public Tab: typeof Tab = Tab;

	public readonly inboxMessages: Signal<Message[]> = computed(() => this.messagesData().inbox.messages);
	public readonly inboxTotal: Signal<number> = computed(() => this.messagesData().inbox.total);
	public readonly sentMessages: Signal<Message[]> = computed(() => this.messagesData().sent.messages);
	public readonly sentTotal: Signal<number> = computed(() => this.messagesData().sent.total);
	public readonly page: Signal<number> = computed(() => this.messagesData().page);

	constructor(
		private messageService: MessageService,
		private router: Router,
		private route: ActivatedRoute,
		private toastService: ToastService,
		private modalService: ModalService
	) {
		this.messageService.refreshUnreadCount();
	}

	public switchTab(tab: Tab): void {
		this.activeTab.set(tab);
		this.selectedMessage.set(null);
		this.router.navigate([], { relativeTo: this.route, queryParams: { pageIndex: 1 } });
	}

	public onPageChange(page: number): void {
		this.selectedMessage.set(null);
		this.router.navigate([], { relativeTo: this.route, queryParams: { pageIndex: page } });
	}

	public markAsRead(msg: Message): void {
		if (!msg.is_read && this.activeTab() === Tab.INBOX) {
			this.messageService.markAsRead(msg.id).subscribe({
				next: () => {
					this.router.navigate([], {
						relativeTo: this.route,
						queryParams: { pageIndex: this.page() },
						onSameUrlNavigation: 'reload',
						replaceUrl: true
					});
				},
				error: () => this.toastService.error('Failed to mark as read')
			});
		}
	}

	public deleteMessage(msg: Message): void {
		this.modalService.confirm('Delete this message?').then((confirmed) => {
			if (!confirmed) return;
			this.messageService.deleteMessage(msg.id).subscribe({
				next: () => {
					if (this.selectedMessage()?.id === msg.id) {
						this.selectedMessage.set(null);
					}

					const currentTotal = this.activeTab() === Tab.INBOX ? this.inboxTotal() : this.sentTotal();
					const maxPage = Math.max(1, Math.ceil((currentTotal - 1) / PAGE_SIZE));
					const pageToLoad = Math.min(this.page(), maxPage);

					this.router.navigate([], {
						relativeTo: this.route,
						queryParams: { pageIndex: pageToLoad },
						onSameUrlNavigation: 'reload',
						replaceUrl: true
					});
					this.toastService.warning('Message deleted successfully');
				},
				error: (err) => this.toastService.error(err.error?.message || 'Failed to delete')
			});
		});
	}

	public sendMessage(data: SendMessageRequest): void {
		this.messageService.sendMessage(data).subscribe({
			next: () => {
				this.router.navigate([], { relativeTo: this.route, queryParams: { pageIndex: 1 } });
				this.toastService.success('Message sent successfully');
			},
			error: (err) => {
				this.toastService.error(err.error?.message || 'Failed to send message');
			}
		});
	}
}
