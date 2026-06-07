import { DatePipe } from '@angular/common';
import { Component, computed, input, InputSignal, linkedSignal, Signal, WritableSignal } from '@angular/core';
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
	public readonly pageSize: number = 12;
	public readonly eventsData: InputSignal<EventsResponseExtended | null | undefined> = input<EventsResponseExtended | null>();
	public readonly recommendedEventsData: InputSignal<EventsResponse | null | undefined> = input<EventsResponse | null>();

	public readonly queryParams: Signal<Params> = toSignal(this.activatedRoute.queryParams, { initialValue: {} as Params });
	public readonly currentPage: Signal<number> = computed(() => {
		const p: number = Number(this.queryParams()['page']);
		return p >= 1 ? p : 1;
	});

	public recommendedEvents: Signal<EventModel[]> = computed(() => this.recommendedEventsData()?.events || []);

	public isLoggedIn: Signal<boolean> = this.authService.isLoggedIn;

	public readonly filterModel: WritableSignal<{
		title: string;
		description: string;
		category: string;
		location: string;
		dateFrom: string;
		dateTo: string;
		minPrice: string;
		maxPrice: string;
	}> = linkedSignal(() => {
		const queryParams: Params = this.queryParams();
		return {
			title: queryParams['title'] || '',
			description: queryParams['description'] || '',
			category: queryParams['category'] || '',
			location: queryParams['location'] || '',
			dateFrom: queryParams['dateFrom'] || '',
			dateTo: queryParams['dateTo'] || '',
			minPrice: queryParams['minPrice'] || '',
			maxPrice: queryParams['maxPrice'] || ''
		};
	});
	public readonly filterForm = form(this.filterModel);

	public events: Signal<EventModel[]> = computed(() => this.eventsData()?.events || []);
	public total: Signal<number> = computed(() => this.eventsData()?.total || 0);

	public totalPages: Signal<number> = computed(() => Math.ceil(this.total() / this.pageSize));
	public pages: Signal<number[]> = computed(() => {
		const pages: number[] = [];
		for (let i = 1; i <= this.totalPages(); i++) {
			pages.push(i);
		}
		return pages;
	});

	public categories: EventCategory[] = Object.values(EventCategory);

	constructor(
		private activatedRoute: ActivatedRoute,
		private authService: AuthService,
		private router: Router
	) {}

	public onSearch(event: Event): void {
		event.preventDefault();
		const model = this.filterModel();
		this.router.navigate([], {
			relativeTo: this.activatedRoute,
			queryParams: {
				title: model.title || null,
				description: model.description || null,
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

	public onReset(): void {
		this.router.navigate([], {
			relativeTo: this.activatedRoute,
			queryParams: {
				title: null,
				description: null,
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

	public onPageChange(page: number): void {
		this.router.navigate([], {
			relativeTo: this.activatedRoute,
			queryParams: { page: page > 1 ? page : null },
			queryParamsHandling: 'merge'
		});
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	public goToEventDetail(eventId: number): void {
		this.router.navigate([eventId], { relativeTo: this.activatedRoute.parent });
	}

	public getMinPrice(event: EventModel): number {
		if (!event.ticket_types || event.ticket_types.length === 0) return 0;
		return Math.min(...event.ticket_types.map((t) => t.price));
	}
}
