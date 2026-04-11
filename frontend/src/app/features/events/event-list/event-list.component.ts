import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { EventService } from '../../../core/services/event.service';
import { AuthService } from '../../../core/services/auth.service';
import { Event, EventFilters } from '../../../shared/models/event.model';
import { NgClass, DatePipe } from '@angular/common';
import { signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';

@Component({
    selector: 'app-event-list',
    templateUrl: './event-list.component.html',
  standalone: true,
  imports: [RouterLink, NgClass, DatePipe, FormField]
})
export class EventListComponent implements OnInit {
  events: Event[] = [];
  recommendedEvents: Event[] = [];
  total: number = 0;
  currentPage: number = 1;
  pageSize: number = 12;
  loading: boolean = false;
  error: string = '';
  readonly filterModel = signal({
    title: '',
    category: '',
    location: '',
    dateFrom: '',
    dateTo: '',
    minPrice: '',
    maxPrice: '',
  });
  readonly filterForm = form(this.filterModel);
  isLoggedIn: boolean = false;
  isManageMode: boolean = false;

  categories = [
    'Music', 'Sports', 'Arts', 'Technology', 'Business',
    'Food & Drink', 'Health', 'Community', 'Film', 'Fashion', 'Education', 'Other',
  ];

  constructor(
    private eventService: EventService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    this.isManageMode = this.router.url.startsWith('/manage');
    this.loadEvents();
    if (this.isLoggedIn && !this.isManageMode) {
      this.loadRecommendations();
    }
  }

  loadEvents(): void {
    this.loading = true;
    this.error = '';

    if (this.isManageMode) {
      this.eventService.getMyEvents().subscribe({
        next: (res) => {
          this.events = res.events;
          this.total = res.total;
          this.loading = false;
        },
        error: () => {
          this.error = 'Failed to load your events';
          this.loading = false;
        },
      });
      return;
    }

    const filters: EventFilters = {
      ...this.filterModel(),
      minPrice: this.filterModel().minPrice ? Number(this.filterModel().minPrice) : undefined,
      maxPrice: this.filterModel().maxPrice ? Number(this.filterModel().maxPrice) : undefined,
      page: this.currentPage,
      limit: this.pageSize,
    };
    Object.keys(filters).forEach((k) => {
      if ((filters as any)[k] === '' || (filters as any)[k] === null) {
        delete (filters as any)[k];
      }
    });

    this.eventService.getEvents(filters).subscribe({
      next: (res) => {
        this.events = res.events;
        this.total = res.total;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load events';
        this.loading = false;
      },
    });
  }

  loadRecommendations(): void {
    this.eventService.getRecommendations(6).subscribe({
      next: (res) => (this.recommendedEvents = res.events),
      error: () => {},
    });
  }

  onSearch(): void {
    this.currentPage = 1;
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
      maxPrice: '',
    });
    this.currentPage = 1;
    this.loadEvents();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadEvents();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  publishEvent(event: Event): void {
    if (!confirm(`Publish "${event.title}"? It will become visible to all users.`)) return;
    this.eventService.publishEvent(event.id).subscribe({
      next: () => this.loadEvents(),
      error: (err) => alert(err.error?.message || 'Failed to publish event'),
    });
  }

  cancelEvent(event: Event): void {
    if (!confirm(`Cancel "${event.title}"? This cannot be undone.`)) return;
    this.eventService.cancelEvent(event.id).subscribe({
      next: () => this.loadEvents(),
      error: (err) => alert(err.error?.message || 'Failed to cancel event'),
    });
  }

  deleteEvent(event: Event): void {
    if (!confirm(`Delete "${event.title}"? This is permanent.`)) return;
    this.eventService.deleteEvent(event.id).subscribe({
      next: () => this.loadEvents(),
      error: (err) => alert(err.error?.message || 'Failed to delete event'),
    });
  }

  get totalPages(): number {
    return Math.ceil(this.total / this.pageSize);
  }

  get pages(): number[] {
    const pages = [];
    for (let i = 1; i <= this.totalPages; i++) pages.push(i);
    return pages;
  }

  getMinPrice(event: Event): number {
    if (!event.ticket_types || event.ticket_types.length === 0) return 0;
    return Math.min(...event.ticket_types.map((t) => t.price));
  }

  statusBadgeClass(status: string): string {
    switch (status) {
      case 'PUBLISHED': return 'bg-success';
      case 'DRAFT': return 'bg-secondary';
      case 'CANCELLED': return 'bg-danger';
      case 'COMPLETED': return 'bg-info';
      default: return 'bg-secondary';
    }
  }
}
