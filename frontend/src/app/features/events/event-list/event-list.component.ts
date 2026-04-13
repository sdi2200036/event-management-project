import { DatePipe, NgClass } from '@angular/common';
import { afterNextRender, Component, computed, effect, input, Signal, signal, WritableSignal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { EventService } from '../../../core/services/event.service';
import { EventCategory, EventFilters, EventsResponse, Event as EventModel } from '../../../shared/models/event.model';

@Component({
	selector: 'app-event-list',
	templateUrl: './event-list.component.html',
	standalone: true,
	imports: [NgClass, DatePipe, FormField]
})
export class EventListComponent {
	readonly myEventsData = input<EventsResponse | null>();

	events: WritableSignal<EventModel[]> = signal([]);
	recommendedEvents: WritableSignal<EventModel[]> = signal([]);
	total: WritableSignal<number> = signal(0);
	currentPage: WritableSignal<number> = signal(1);
	pageSize: WritableSignal<number> = signal(12);
	loading: WritableSignal<boolean> = signal(false);
	error: WritableSignal<string> = signal('');

	readonly filterModel = signal({
		title: '',
		category: '',
		location: '',
		dateFrom: '',
		dateTo: '',
		minPrice: '',
		maxPrice: ''
	});
	readonly filterForm = form(this.filterModel);

	isLoggedIn: Signal<boolean> = this.authService.isLoggedIn;
	isManageMode: Signal<boolean> = computed(() => this.router.url.includes('/manage'));

	categories = Object.values(EventCategory);

	totalPages: Signal<number> = computed(() => Math.ceil(this.total() / this.pageSize()));

	pages: Signal<number[]> = computed(() => {
		const pages = [];
		for (let i = 1; i <= this.totalPages(); i++) {
			pages.push(i);
		}
		return pages;
	});

	constructor(
		private eventService: EventService,
		private authService: AuthService,
		private router: Router
	) {
		effect(() => {
			const resolvedData = this.myEventsData();
			if (resolvedData) {
				this.events.set(resolvedData.events);
				this.total.set(resolvedData.total);
			}
		});

		afterNextRender(() => {
			if (!this.isManageMode()) {
				this.loadEvents();
				if (this.isLoggedIn()) {
					this.loadRecommendations();
				}
			}
		});
	}

	loadEvents(): void {
		this.loading.set(true);
		this.error.set('');

		if (this.isManageMode()) {
			this.eventService.getMyEvents().subscribe({
				next: (res) => {
					this.events.set(res.events);
					this.total.set(res.total);
					this.loading.set(false);
				},
				error: () => {
					this.error.set('Failed to load your events');
					this.loading.set(false);
				}
			});
			return;
		}

		const filters: EventFilters = {
			...this.filterModel(),
			minPrice: this.filterModel().minPrice ? Number(this.filterModel().minPrice) : undefined,
			maxPrice: this.filterModel().maxPrice ? Number(this.filterModel().maxPrice) : undefined,
			page: this.currentPage(),
			limit: this.pageSize(),
			category: this.filterModel().category != '' ? (this.filterModel().category as EventCategory) : undefined
		};
		Object.keys(filters).forEach((k) => {
			if ((filters as Record<string, unknown>)[k] === '' || (filters as Record<string, unknown>)[k] === null) {
				delete (filters as Record<string, unknown>)[k];
			}
		});

		this.loading.set(true);
		this.eventService.getEvents(filters).subscribe({
			next: (res) => {
				this.events.set(res.events);
				this.total.set(res.total);
				this.loading.set(false);
			},
			error: () => {
				this.error.set('Failed to load events');
				this.loading.set(false);
			}
		});
	}

	loadRecommendations(): void {
		this.eventService.getRecommendations(6).subscribe({
			next: (res) => this.recommendedEvents.set(res.events),
			error: () => { }
		});
	}

	onSearch(event: Event): void {
		event.preventDefault();
		this.currentPage.set(1);
		this.loadEvents();
	}

	onReset(): void {
		this.filterModel.set({
			title: '',
			category: '',
			location: '',
			dateFrom: '',
			dateTo: '',
			minPrice: '',
			maxPrice: ''
		});
		this.currentPage.set(1);
		this.loadEvents();
	}

	onPageChange(page: number): void {
		this.currentPage.set(page);
		this.loadEvents();
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	goToCreateEvent(): void {
		this.router.navigate(['manage', 'events', 'new']);
	}

	goToEventDetail(eventId: number): void {
		this.router.navigate(['events', eventId]);
	}

	goToEditEvent(eventId: number): void {
		this.router.navigate(['manage', 'events', eventId, 'edit']);
	}

	publishEvent(event: EventModel): void {
		if (!confirm(`Publish "${event.title}"? It will become visible to all users.`)) return;
		this.eventService.publishEvent(event.id).subscribe({
			next: () => this.loadEvents(),
			error: (err) => alert(err.error?.message || 'Failed to publish event')
		});
	}

	cancelEvent(event: EventModel): void {
		if (!confirm(`Cancel "${event.title}"? This cannot be undone.`)) return;
		this.eventService.cancelEvent(event.id).subscribe({
			next: () => this.loadEvents(),
			error: (err) => alert(err.error?.message || 'Failed to cancel event')
		});
	}

	deleteEvent(event: EventModel): void {
		if (!confirm(`Delete "${event.title}"? This is permanent.`)) return;
		this.eventService.deleteEvent(event.id).subscribe({
			next: () => this.loadEvents(),
			error: (err) => alert(err.error?.message || 'Failed to delete event')
		});
	}

	getMinPrice(event: EventModel): number {
		if (!event.ticket_types || event.ticket_types.length === 0) return 0;
		return Math.min(...event.ticket_types.map((t) => t.price));
	}

	statusBadgeClass(status: string): string {
		switch (status) {
			case 'PUBLISHED':
				return 'bg-success';
			case 'DRAFT':
				return 'bg-secondary';
			case 'CANCELLED':
				return 'bg-danger';
			case 'COMPLETED':
				return 'bg-info';
			default:
				return 'bg-secondary';
		}
	}
}
