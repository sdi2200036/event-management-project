import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService, Message } from '../../core/services/message.service';

@Component({
  selector: 'app-messaging',
  templateUrl: './messaging.component.html',
})
export class MessagingComponent implements OnInit {
  activeTab: 'inbox' | 'sent' | 'compose' = 'inbox';
  inbox: Message[] = [];
  sent: Message[] = [];
  loading: boolean = false;
  error: string = '';
  success: string = '';
  composeForm: FormGroup;
  selectedMessage: Message | null = null;

  constructor(private messageService: MessageService, private fb: FormBuilder) {
    this.composeForm = this.fb.group({
      receiver_id: [null, [Validators.required, Validators.min(1)]],
      subject: ['', [Validators.required, Validators.maxLength(255)]],
      body: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadInbox();
  }

  loadInbox(): void {
    this.loading = true;
    this.messageService.getInbox().subscribe({
      next: (msgs) => {
        this.inbox = msgs;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load inbox';
        this.loading = false;
      },
    });
  }

  loadSent(): void {
    this.loading = true;
    this.messageService.getSent().subscribe({
      next: (msgs) => {
        this.sent = msgs;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load sent messages';
        this.loading = false;
      },
    });
  }

  switchTab(tab: 'inbox' | 'sent' | 'compose'): void {
    this.activeTab = tab;
    this.selectedMessage = null;
    this.error = '';
    this.success = '';

    if (tab === 'inbox') this.loadInbox();
    if (tab === 'sent') this.loadSent();
  }

  openMessage(msg: Message): void {
    this.selectedMessage = msg;
    if (!msg.is_read && this.activeTab === 'inbox') {
      this.messageService.markAsRead(msg.id).subscribe({
        next: () => (msg.is_read = true),
        error: () => {},
      });
    }
  }

  deleteMessage(msg: Message): void {
    if (!confirm('Delete this message?')) return;
    this.messageService.deleteMessage(msg.id).subscribe({
      next: () => {
        if (this.activeTab === 'inbox') {
          this.inbox = this.inbox.filter((m) => m.id !== msg.id);
        } else {
          this.sent = this.sent.filter((m) => m.id !== msg.id);
        }
        if (this.selectedMessage?.id === msg.id) {
          this.selectedMessage = null;
        }
      },
      error: (err) => (this.error = err.error?.message || 'Failed to delete'),
    });
  }

  sendMessage(): void {
    if (this.composeForm.invalid) return;

    this.loading = true;
    this.messageService.sendMessage(this.composeForm.value).subscribe({
      next: () => {
        this.success = 'Message sent successfully!';
        this.composeForm.reset();
        this.loading = false;
        setTimeout(() => this.switchTab('sent'), 1500);
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to send message';
        this.loading = false;
      },
    });
  }

  get unreadCount(): number {
    return this.inbox.filter((m) => !m.is_read).length;
  }
}
