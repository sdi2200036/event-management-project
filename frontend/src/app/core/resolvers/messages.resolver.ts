import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { catchError, forkJoin, map, of } from 'rxjs';
import { MessageService, PaginatedInboxResponse, PaginatedSentResponse } from '../services/message.service';
import { ToastService } from '../services/toast.service';

export interface MessagesResolverData {
	inbox: PaginatedInboxResponse;
	sent: PaginatedSentResponse;
	page: number;
}

export const messagesResolver: ResolveFn<MessagesResolverData> = (route: ActivatedRouteSnapshot) => {
	const messageService: MessageService = inject(MessageService);
	const toastService: ToastService = inject(ToastService);

	const page = Math.max(1, parseInt(route.queryParamMap.get('pageIndex') ?? '1', 10));

	return forkJoin([messageService.getInbox(page), messageService.getSent(page)]).pipe(
		map(([inbox, sent]) => ({ inbox, sent, page })),
		catchError(() => {
			toastService.error('Failed to load messages.');
			return of({
				inbox: { messages: [], total: 0, unread_count: 0 } as PaginatedInboxResponse,
				sent: { messages: [], total: 0 } as PaginatedSentResponse,
				page
			});
		})
	);
};
