import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService } from '../../../core/services/event.service';
import { Event } from '../../../shared/models/event.model';
import { signal } from '@angular/core';
import { FormField, applyEach, form, maxLength, min, required, submit } from '@angular/forms/signals';

type EventFormModel = {
  title: string;
  event_type: string;
  description: string;
  venue: string;
  address: string;
  city: string;
  country: string;
  geo_lat: number | null;
  geo_lng: number | null;
  start_datetime: string;
  end_datetime: string;
  capacity: number;
  categories: string[];
  ticket_types: Array<{ name: string; price: number; quantity: number }>;
};

@Component({
    selector: 'app-event-form',
    templateUrl: './event-form.component.html',
  standalone: true,
  imports: [FormField]
})
export class EventFormComponent implements OnInit {
  readonly eventModel = signal<EventFormModel>({
    title: '',
    event_type: '',
    description: '',
    venue: '',
    address: '',
    city: '',
    country: '',
    geo_lat: null,
    geo_lng: null,
    start_datetime: '',
    end_datetime: '',
    capacity: 100,
    categories: [],
    ticket_types: [{ name: '', price: 0, quantity: 100 }],
  });
  readonly eventForm = form(this.eventModel, (p) => {
    required(p.title);
    maxLength(p.title, 255);
    required(p.start_datetime);
    required(p.end_datetime);
    required(p.capacity);
    min(p.capacity, 1);
    applyEach(p.ticket_types, (tt) => {
      required(tt.name);
      required(tt.price);
      min(tt.price, 0);
      required(tt.quantity);
      min(tt.quantity, 1);
    });
  });
  isEditMode: boolean = false;
  eventId: number | null = null;
  loading: boolean = false;
  error: string = '';
  success: string = '';

  categories = [
    'Music', 'Sports', 'Arts', 'Technology', 'Business',
    'Food & Drink', 'Health', 'Community', 'Film', 'Fashion', 'Education', 'Other',
  ];

  constructor(
    private eventService: EventService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.eventId = parseInt(id, 10);
      this.loadEvent(this.eventId);
    }
  }

  loadEvent(id: number): void {
    this.loading = true;
    this.eventService.getEvent(id).subscribe({
      next: (event: Event) => {
        this.eventModel.set({
          title: event.title,
          event_type: event.event_type || '',
          description: event.description || '',
          venue: event.venue || '',
          address: event.address || '',
          city: event.city || '',
          country: event.country || '',
          geo_lat: event.geo_lat || null,
          geo_lng: event.geo_lng || null,
          start_datetime: event.start_datetime ? new Date(event.start_datetime).toISOString().slice(0, 16) : '',
          end_datetime: event.end_datetime ? new Date(event.end_datetime).toISOString().slice(0, 16) : '',
          capacity: event.capacity || 100,
          categories: event.categories || [],
          ticket_types: (event.ticket_types || []).length
            ? event.ticket_types!.map((tt) => ({
                name: tt.name,
                price: tt.price,
                quantity: tt.quantity,
              }))
            : [{ name: '', price: 0, quantity: 100 }],
        });

        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load event';
        this.loading = false;
      },
    });
  }

  addTicketType(): void {
    this.eventModel.update((current) => ({
      ...current,
      ticket_types: [...current.ticket_types, { name: '', price: 0, quantity: 100 }],
    }));
  }

  removeTicketType(index: number): void {
    this.eventModel.update((current) => ({
      ...current,
      ticket_types:
        current.ticket_types.length <= 1
          ? current.ticket_types
          : current.ticket_types.filter((_, i) => i !== index),
    }));
  }

  toggleCategory(cat: string): void {
    const current = [...this.eventModel().categories];
    const idx = current.indexOf(cat);
    if (idx > -1) {
      current.splice(idx, 1);
    } else {
      current.push(cat);
    }
    this.eventModel.update((value) => ({ ...value, categories: current }));
  }

  isCategorySelected(cat: string): boolean {
    return this.eventModel().categories.includes(cat);
  }

  cancel(): void {
    this.router.navigate(['/manage/events']);
  }

  async onSubmit(): Promise<void> {
    const isValid = await submit(this.eventForm);
    if (!isValid) return;

    this.loading = true;
    this.error = '';

    const formValue = this.eventModel();
    const payload = {
      ...formValue,
      geo_lat: formValue.geo_lat ?? undefined,
      geo_lng: formValue.geo_lng ?? undefined,
      ticket_types: formValue.ticket_types.map((tt) => ({
        ...tt,
        available: tt.quantity,
      })),
    };

    if (this.isEditMode && this.eventId) {
      this.eventService.updateEvent(this.eventId, payload).subscribe({
        next: () => {
          this.success = 'Event updated successfully!';
          this.loading = false;
          setTimeout(() => this.router.navigate(['/manage/events']), 1500);
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to update event';
          this.loading = false;
        },
      });
    } else {
      this.eventService.createEvent(payload).subscribe({
        next: (event) => {
          this.success = 'Event created successfully!';
          this.loading = false;
          setTimeout(() => this.router.navigate(['/manage/events']), 1500);
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to create event';
          this.loading = false;
        },
      });
    }
  }
}
