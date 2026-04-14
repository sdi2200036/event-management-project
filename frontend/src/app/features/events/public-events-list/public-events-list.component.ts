import { DatePipe } from '@angular/common';
import { Component, computed, input, linkedSignal, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { form, FormField } from '@angular/forms/signals';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import {
	EventCategory,
	Event as EventModel,
	EventsResponse,
	EventsResponseExtended
} from 'src/app/shared/models/event.model';

@Component({
	selector: 'app-public-events-list',
	imports: [FormField, DatePipe],
	templateUrl: './public-events-list.component.html'
})
export class PublicEventsListComponent {
	readonly pageSize = 12;
	readonly eventsData = input<EventsResponseExtended | null>();
	readonly recommendedEventsData = input<EventsResponse | null>();

	readonly queryParams = toSignal(this.activatedRoute.queryParams, { initialValue: {} as Params });
	readonly currentPage: Signal<number> = computed(() => {
		const p = Number(this.queryParams()['page']);
		return p >= 1 ? p : 1;
	});

	recommendedEvents: Signal<EventModel[]> = computed(() => this.recommendedEventsData()?.events || []);

	isLoggedIn: Signal<boolean> = this.authService.isLoggedIn;

	readonly filterModel = linkedSignal(() => {
		const queryParams = this.queryParams();
		return {
			title: queryParams['title'] || '',
			category: queryParams['category'] || '',
			location: queryParams['location'] || '',
			dateFrom: queryParams['dateFrom'] || '',
			dateTo: queryParams['dateTo'] || '',
			minPrice: queryParams['minPrice'] || '',
			maxPrice: queryParams['maxPrice'] || ''
		};
	});
	readonly filterForm = form(this.filterModel);

	events: Signal<EventModel[]> = computed(() => this.eventsData()?.events || []);
	total: Signal<number> = computed(() => this.eventsData()?.total || 0);

	totalPages: Signal<number> = computed(() => Math.ceil(this.total() / this.pageSize));
	pages: Signal<number[]> = computed(() => {
		const pages = [];
		for (let i = 1; i <= this.totalPages(); i++) {
			pages.push(i);
		}
		return pages;
	});

	categories = Object.values(EventCategory);

	constructor(
		private activatedRoute: ActivatedRoute,
		private authService: AuthService,
		private router: Router
	) {}

	onSearch(event: Event): void {
		event.preventDefault();
		const model = this.filterModel();
		this.router.navigate([], {
			relativeTo: this.activatedRoute,
			queryParams: {
				title: model.title || null,
				category: model.category || null,
				location: model.location || null,
				dateFrom: model.dateFrom || null,
				dateTo: model.dateTo || null,
				minPrice: model.minPrice || null,
				maxPrice: model.maxPrice || null,
				page: null
			}
		});
	}

	onReset(): void {
		this.router.navigate([], {
			relativeTo: this.activatedRoute,
			queryParams: {
				title: null,
				category: null,
				location: null,
				dateFrom: null,
				dateTo: null,
				minPrice: null,
				maxPrice: null,
				page: null
			}
		});
	}

	onPageChange(page: number): void {
		this.router.navigate([], {
			relativeTo: this.activatedRoute,
			queryParams: { page: page > 1 ? page : null },
			queryParamsHandling: 'merge'
		});
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	goToEventDetail(eventId: number): void {
		this.router.navigate([eventId], { relativeTo: this.activatedRoute.parent });
	}

	getMinPrice(event: EventModel): number {
		if (!event.ticket_types || event.ticket_types.length === 0) return 0;
		return Math.min(...event.ticket_types.map((t) => t.price));
	}
}
