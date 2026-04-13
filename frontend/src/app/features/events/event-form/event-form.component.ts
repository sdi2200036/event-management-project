import { afterNextRender, Component, computed, effect, ElementRef, input, Signal, signal, viewChild, WritableSignal } from '@angular/core';
import { applyEach, FieldState, form, FormField, maxLength, min, required, submit } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { catchError, firstValueFrom, of, switchMap } from 'rxjs';
import { EventService } from '../../../core/services/event.service';
import { EventCategory, Event as EventModel } from '../../../shared/models/event.model';

declare const L: any; // Leaflet global

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
	categories: EventCategory[];
	ticket_types: Array<{ name: string; price: number; quantity: number }>;
};

@Component({
	selector: 'app-event-form',
	templateUrl: './event-form.component.html',
	standalone: true,
	imports: [FormField]
})
export class EventFormComponent {
	// Resolved event data for edit mode (null/undefined for create mode)
	readonly eventData = input<EventModel | null>();

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
		ticket_types: [{ name: '', price: 0, quantity: 100 }]
	});
	readonly eventForm = form(this.eventModel, (p) => {
		required(p.title, { message: 'Title is required' });
		maxLength(p.title, 255, { message: 'Title must be at most 255 characters' });
		required(p.start_datetime, { message: 'Start date/time is required' });
		required(p.end_datetime, { message: 'End date/time is required' });
		required(p.capacity, { message: 'Capacity is required' });
		min(p.capacity, 1, { message: 'Capacity must be at least 1' });
		applyEach(p.ticket_types, (tt) => {
			required(tt.name, { message: 'Ticket type name is required' });
			required(tt.price, { message: 'Price is required' });
			min(tt.price, 0, { message: 'Price must be greater or equal to 0' });
			required(tt.quantity, { message: 'Quantity is required' });
			min(tt.quantity, 1, { message: 'Quantity must be at least 1' });
		});
	});

	readonly isEditMode: Signal<boolean> = computed(() => !!this.eventData());
	loading: WritableSignal<boolean> = signal(false);
	error: WritableSignal<string> = signal('');
	success: WritableSignal<string> = signal('');

	categories = Object.values(EventCategory);

	// Map state
	private map: any = null;
	private marker: any = null;
	readonly mapSearchInput = viewChild<ElementRef<HTMLInputElement>>('mapSearchInput');
	searchingAddress: WritableSignal<boolean> = signal(false);

	constructor(
		private eventService: EventService,
		private router: Router
	) {
		// Populate form from resolved data in edit mode
		effect(() => {
			const event = this.eventData();
			if (event) {
				this.populateForm(event);
			}
		});

		// Initialize map after render
		afterNextRender(() => {
			this.initFormMap();
		});
	}

	private populateForm(event: EventModel): void {
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
						quantity: tt.quantity
					}))
				: [{ name: '', price: 0, quantity: 100 }]
		});
	}

	// === Map Picker Logic ===

	private initFormMap(): void {
		if (typeof L === 'undefined') return;

		const existingLat = this.eventModel().geo_lat;
		const existingLng = this.eventModel().geo_lng;
		const centerLat = existingLat ?? 37.9838;
		const centerLng = existingLng ?? 23.7275;
		const zoom = existingLat && existingLng ? 15 : 6;

		try {
			this.map = L.map('form-map').setView([centerLat, centerLng], zoom);
			L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
			}).addTo(this.map);

			// Place marker if editing with existing coords
			if (existingLat && existingLng) {
				this.placeMarker(existingLat, existingLng);
			}

			// Click to place/move marker
			this.map.on('click', (e: any) => {
				this.placeMarker(e.latlng.lat, e.latlng.lng);
				this.updateGeoCoords(e.latlng.lat, e.latlng.lng);
			});
		} catch (e) {
			console.warn('Form map initialization failed:', e);
		}
	}

	private placeMarker(lat: number, lng: number): void {
		if (this.marker) {
			this.marker.setLatLng([lat, lng]);
		} else {
			this.marker = L.marker([lat, lng], { draggable: true }).addTo(this.map);
			// Update coords when marker is dragged
			this.marker.on('dragend', () => {
				const pos = this.marker.getLatLng();
				this.updateGeoCoords(pos.lat, pos.lng);
			});
		}
	}

	private updateGeoCoords(lat: number, lng: number): void {
		this.eventModel.update((current) => ({
			...current,
			geo_lat: Math.round(lat * 1000000) / 1000000,
			geo_lng: Math.round(lng * 1000000) / 1000000
		}));
	}

	searchAddress(): void {
		const inputEl = this.mapSearchInput();
		if (!inputEl) return;

		const query = inputEl.nativeElement.value.trim();
		if (!query) return;

		this.searchingAddress.set(true);

		fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`)
			.then((res) => res.json())
			.then((results: Array<{ lat: string; lon: string; display_name: string }>) => {
				if (results.length > 0) {
					const lat = parseFloat(results[0].lat);
					const lng = parseFloat(results[0].lon);
					this.map?.setView([lat, lng], 16);
					this.placeMarker(lat, lng);
					this.updateGeoCoords(lat, lng);
				} else {
					alert('Address not found. Try a different search term.');
				}
				this.searchingAddress.set(false);
			})
			.catch(() => {
				alert('Failed to search address. Please try again.');
				this.searchingAddress.set(false);
			});
	}

	clearMapSelection(): void {
		if (this.marker) {
			this.map?.removeLayer(this.marker);
			this.marker = null;
		}
		this.eventModel.update((current) => ({
			...current,
			geo_lat: null,
			geo_lng: null
		}));
	}

	// === Form Actions ===

	addTicketType(): void {
		this.eventModel.update((current) => ({
			...current,
			ticket_types: [...current.ticket_types, { name: '', price: 0, quantity: 100 }]
		}));
	}

	removeTicketType(index: number): void {
		this.eventModel.update((current) => ({
			...current,
			ticket_types:
				current.ticket_types.length <= 1
					? current.ticket_types
					: current.ticket_types.filter((_, i) => i !== index)
		}));
	}

	toggleCategory(cat: EventCategory): void {
		const current = [...this.eventModel().categories];
		const idx = current.indexOf(cat);
		if (idx > -1) {
			current.splice(idx, 1);
		} else {
			current.push(cat);
		}
		this.eventModel.update((value) => ({ ...value, categories: current }));
	}

	isCategorySelected(cat: EventCategory): boolean {
		return this.eventModel().categories.includes(cat);
	}

	cancel(): void {
		this.router.navigate(['/manage/events']);
	}

	async onSubmit(event: Event): Promise<void> {
		event.preventDefault();

		await submit(this.eventForm, (form) => {
			this.loading.set(true);
			this.error.set('');

			const formValue = form().value();
			const payload = {
				...formValue,
				categories: formValue.categories.length > 0 ? (formValue.categories as EventCategory[]) : undefined,
				geo_lat: formValue.geo_lat ?? undefined,
				geo_lng: formValue.geo_lng ?? undefined,
				ticket_types: formValue.ticket_types.map((tt) => ({
					...tt,
					available: tt.quantity
				}))
			};

			const eventData = this.eventData();
			if (this.isEditMode() && eventData) {
				return firstValueFrom(
					this.eventService.updateEvent(eventData.id, payload).pipe(
						switchMap(() => {
							this.success.set('Event updated successfully!');
							this.loading.set(false);
							setTimeout(() => this.router.navigate(['/manage/events']), 1500);
							return of(undefined);
						}),
						catchError((err) => {
							this.loading.set(false);
							return of([
								{
									kind: 'server',
									field: 'form',
									message: err.error?.message || 'Failed to update event'
								}
							]);
						})
					)
				);
			} else {
				return firstValueFrom(
					this.eventService.createEvent(payload).pipe(
						switchMap(() => {
							this.success.set('Event created successfully!');
							this.loading.set(false);
							setTimeout(() => this.router.navigate(['/manage/events']), 1500);
							return of(undefined);
						}),
						catchError((err) => {
							this.loading.set(false);
							return of([
								{
									kind: 'server',
									field: 'form',
									message: err.error?.message || 'Failed to create event'
								}
							]);
						})
					)
				);
			}
		});
	}

	protected isFieldInvalid(field: FieldState<unknown>): boolean {
		return field.touched() && !field.valid();
	}
}
