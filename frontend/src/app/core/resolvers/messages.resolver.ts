import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { catchError, forkJoin, map, of } from 'rxjs';
import { MessageService } from '../services/message.service';
import { ToastService } from '../services/toast.service';

export const messagesResolver: ResolveFn<{ sent: any[]; inbox: any[] }> = () => {
	const messageService: MessageService = inject(MessageService);
	const toastService: ToastService = inject(ToastService);

	return forkJoin([messageService.getInbox(), messageService.getSent()]).pipe(
		map(([inbox, sent]) => {
			return { sent: sent, inbox: inbox };
		}),
		catchError(() => {
			toastService.error('Failed to load messages.');
			return of({ sent: [], inbox: [] });
		})
	);
};
