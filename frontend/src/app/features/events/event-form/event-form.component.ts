import {
	afterNextRender,
	Component,
	computed,
	ElementRef,
	input,
	linkedSignal,
	Signal,
	signal,
	viewChild,
	WritableSignal
} from '@angular/core';
import {
	applyEach,
	FieldState,
	form,
	FormField,
	maxLength,
	min,
	required,
	submit,
	validate
} from '@angular/forms/signals';
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
	readonly event = input<EventModel | null>(null, { alias: 'eventData' });

	readonly eventModel = linkedSignal<EventFormModel>(() => ({
		title: this.event()?.title || '',
		event_type: this.event()?.event_type || '',
		description: this.event()?.description || '',
		venue: this.event()?.venue || '',
		address: this.event()?.address || '',
		city: this.event()?.city || '',
		country: this.event()?.country || '',
		geo_lat: this.event()?.geo_lat || null,
		geo_lng: this.event()?.geo_lng || null,
		start_datetime: this.event()?.start_datetime
			? new Date(this.event()!.start_datetime).toISOString().slice(0, 16)
			: '',
		end_datetime: this.event()?.end_datetime ? new Date(this.event()!.end_datetime).toISOString().slice(0, 16) : '',
		capacity: this.event()?.capacity || 100,
		categories: this.event()?.categories || [],
		ticket_types: (this.event()?.ticket_types || []).length
			? this.event()!.ticket_types!.map((tt) => ({
					name: tt.name,
					price: tt.price,
					quantity: tt.quantity
				}))
			: [{ name: '', price: 0, quantity: 100 }]
	}));

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

		validate(p, ({ valueOf }) => {
			if (valueOf(p.capacity) < valueOf(p.ticket_types).reduce((sum, tt) => sum + tt.quantity, 0)) {
				return [
					{
						kind: 'form',
						field: 'capacity',
						message: 'Capacity cannot be less than total ticket quantity'
					}
				];
			}
			return undefined;
		});
	});

	readonly isEditMode: Signal<boolean> = computed(() => !!this.event());
	photos: WritableSignal<string[]> = signal([]);
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
		// Initialize map after render
		afterNextRender(() => {
			this.initFormMap();
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

	// === Photo Management ===

	onPhotosSelected(event: Event): void {
		const input = event.target as HTMLInputElement;
		if (!input.files) return;

		Array.from(input.files).forEach((file) => {
			const reader = new FileReader();
			reader.onload = () => {
				this.photos.update((current) => [...current, reader.result as string]);
			};
			reader.readAsDataURL(file);
		});

		// Reset so the same file can be selected again if removed
		input.value = '';
	}

	removePhoto(index: number): void {
		this.photos.update((current) => current.filter((_, i) => i !== index));
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
			this.error.set('');

			const formValue = form().value();
			const payload = {
				...formValue,
				photos: this.photos(),
				categories: formValue.categories.length > 0 ? (formValue.categories as EventCategory[]) : undefined,
				geo_lat: formValue.geo_lat ?? undefined,
				geo_lng: formValue.geo_lng ?? undefined,
				ticket_types: formValue.ticket_types.map((tt) => ({
					...tt,
					available: tt.quantity
				}))
			};

			const eventData = this.event();
			if (this.isEditMode() && eventData) {
				return firstValueFrom(
					this.eventService.updateEvent(eventData.id, payload).pipe(
						switchMap(() => {
							this.success.set('Event updated successfully!');
							setTimeout(() => this.router.navigate(['/manage/events']), 1500);
							return of(undefined);
						}),
						catchError((err) => {
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
							setTimeout(() => this.router.navigate(['/manage/events']), 1500);
							return of(undefined);
						}),
						catchError((err) => {
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
