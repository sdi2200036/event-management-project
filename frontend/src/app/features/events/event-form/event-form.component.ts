import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService } from '../../../core/services/event.service';
import { Event } from '../../../shared/models/event.model';

@Component({
  selector: 'app-event-form',
  templateUrl: './event-form.component.html',
})
export class EventFormComponent implements OnInit {
  eventForm: FormGroup;
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
    private fb: FormBuilder,
    private eventService: EventService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.eventForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(255)]],
      event_type: [''],
      description: [''],
      venue: [''],
      address: [''],
      city: [''],
      country: [''],
      geo_lat: [null],
      geo_lng: [null],
      start_datetime: ['', Validators.required],
      end_datetime: ['', Validators.required],
      capacity: [100, [Validators.required, Validators.min(1)]],
      categories: [[]],
      ticket_types: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.eventId = parseInt(id, 10);
      this.loadEvent(this.eventId);
    } else {
      this.addTicketType(); // Add one ticket type by default
    }
  }

  loadEvent(id: number): void {
    this.loading = true;
    this.eventService.getEvent(id).subscribe({
      next: (event: Event) => {
        this.eventForm.patchValue({
          title: event.title,
          event_type: event.event_type,
          description: event.description,
          venue: event.venue,
          address: event.address,
          city: event.city,
          country: event.country,
          geo_lat: event.geo_lat,
          geo_lng: event.geo_lng,
          start_datetime: event.start_datetime ? new Date(event.start_datetime).toISOString().slice(0, 16) : '',
          end_datetime: event.end_datetime ? new Date(event.end_datetime).toISOString().slice(0, 16) : '',
          capacity: event.capacity,
          categories: event.categories || [],
        });

        // Load ticket types
        this.ticketTypes.clear();
        (event.ticket_types || []).forEach((tt) => {
          this.ticketTypes.push(this.createTicketType(tt.name, tt.price, tt.quantity));
        });
        if (this.ticketTypes.length === 0) this.addTicketType();

        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load event';
        this.loading = false;
      },
    });
  }

  get ticketTypes(): FormArray {
    return this.eventForm.get('ticket_types') as FormArray;
  }

  createTicketType(name = '', price = 0, quantity = 100): FormGroup {
    return this.fb.group({
      name: [name, Validators.required],
      price: [price, [Validators.required, Validators.min(0)]],
      quantity: [quantity, [Validators.required, Validators.min(1)]],
    });
  }

  addTicketType(): void {
    this.ticketTypes.push(this.createTicketType());
  }

  removeTicketType(index: number): void {
    this.ticketTypes.removeAt(index);
  }

  toggleCategory(cat: string): void {
    const current: string[] = this.eventForm.get('categories')?.value || [];
    const idx = current.indexOf(cat);
    if (idx > -1) {
      current.splice(idx, 1);
    } else {
      current.push(cat);
    }
    this.eventForm.get('categories')?.setValue([...current]);
  }

  isCategorySelected(cat: string): boolean {
    return (this.eventForm.get('categories')?.value || []).includes(cat);
  }

  onSubmit(): void {
    if (this.eventForm.invalid) return;

    this.loading = true;
    this.error = '';

    const formValue = this.eventForm.value;

    if (this.isEditMode && this.eventId) {
      this.eventService.updateEvent(this.eventId, formValue).subscribe({
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
      this.eventService.createEvent(formValue).subscribe({
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
