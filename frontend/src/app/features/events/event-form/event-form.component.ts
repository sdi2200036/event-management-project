import { Component, computed, input, InputSignal, linkedSignal, Signal, WritableSignal } from '@angular/core';
import {
	applyEach,
	FieldState,
	form,
	FormField,
	maxLength,
	min,
	minLength,
	required,
	submit,
	validate
} from '@angular/forms/signals';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, firstValueFrom, of, switchMap } from 'rxjs';
import { EventService } from '../../../core/services/event.service';
import { ToastService } from '../../../core/services/toast.service';
import { LatLng, MapPickerComponent } from '../../../shared/components/map-picker/map-picker.component';
import { EventCategory, Event as EventModel } from '../../../shared/models/event.model';

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
	imports: [FormField, MapPickerComponent]
})
export class EventFormComponent {
	// Resolved event data for edit mode (null/undefined for create mode)
	public readonly event: InputSignal<EventModel | null> = input<EventModel | null>(null, { alias: 'eventData' });

	public readonly eventModel: WritableSignal<EventFormModel> = linkedSignal<EventFormModel>(() => ({
		title: this.event()?.title || '',
		event_type: this.event()?.event_type || '',
		description: this.event()?.description || '',
		venue: this.event()?.venue || '',
		address: this.event()?.address || '',
		city: this.event()?.city || '',
		country: this.event()?.country || '',
		geo_lat: this.event()?.geo_lat || null,
		geo_lng: this.event()?.geo_lng || null,
		start_datetime: this.event()?.start_datetime ? this.toLocalDatetimeString(this.event()!.start_datetime) : '',
		end_datetime: this.event()?.end_datetime ? this.toLocalDatetimeString(this.event()!.end_datetime) : '',
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

	public readonly eventForm = form(this.eventModel, (p) => {
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

		minLength(p.categories, 1, { message: 'At least one category must be selected' });

		validate(p.end_datetime, ({ valueOf }) => {
			const start = valueOf(p.start_datetime);
			const end = valueOf(p.end_datetime);
			if (start && end && new Date(end) <= new Date(start)) {
				return [
					{ kind: 'field', field: p.end_datetime, message: 'End date/time must be after start date/time' }
				];
			}
			return undefined;
		});

		validate(p.ticket_types, ({ valueOf }) => {
			if (valueOf(p.capacity) < valueOf(p.ticket_types).reduce((sum, tt) => sum + tt.quantity, 0)) {
				return [
					{ kind: 'form', field: 'capacity', message: 'Capacity cannot be less than total ticket quantity' }
				];
			}
			return undefined;
		});
	});

	public readonly isEditMode: Signal<boolean> = computed(() => !!this.event());
	public readonly photos: WritableSignal<string[]> = linkedSignal<string[]>(() => this.event()?.photos ?? []);

	public categories: EventCategory[] = Object.values(EventCategory);

	constructor(
		private eventService: EventService,
		private router: Router,
		private toastService: ToastService,
		private activatedRoute: ActivatedRoute
	) {}

	private toLocalDatetimeString(isoString: string): string {
		const d = new Date(isoString);
		const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
		return local.toISOString().slice(0, 16);
	}

	public onCoordsChange(coords: LatLng | null): void {
		this.eventModel.update((current) => ({
			...current,
			geo_lat: coords?.lat ?? null,
			geo_lng: coords?.lng ?? null
		}));
	}

	// Photo Management

	public onPhotosSelected(event: Event): void {
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

	public removePhoto(index: number): void {
		this.photos.update((current) => current.filter((_, i) => i !== index));
	}

	// Form Actions

	public addTicketType(): void {
		this.eventModel.update((current) => ({
			...current,
			ticket_types: [...current.ticket_types, { name: '', price: 0, quantity: 100 }]
		}));
	}

	public removeTicketType(index: number): void {
		this.eventModel.update((current) => ({
			...current,
			ticket_types:
				current.ticket_types.length <= 1
					? current.ticket_types
					: current.ticket_types.filter((_, i) => i !== index)
		}));
	}

	public toggleCategory(cat: EventCategory): void {
		const current: EventCategory[] = [...this.eventModel().categories];
		const idx: number = current.indexOf(cat);
		if (idx > -1) {
			current.splice(idx, 1);
		} else {
			current.push(cat);
		}
		this.eventModel.update((value) => ({ ...value, categories: current }));
	}

	public isCategorySelected(cat: EventCategory): boolean {
		return this.eventModel().categories.includes(cat);
	}

	public cancel(): void {
		this.router.navigate(['../'], { relativeTo: this.activatedRoute });
	}

	public async onSubmit(event: Event): Promise<void> {
		event.preventDefault();

		await submit(this.eventForm, (form) => {
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
							this.toastService.success('Event updated successfully');
							this.router.navigate(['../'], { relativeTo: this.activatedRoute });
							return of(undefined);
						}),
						catchError((err) => {
							this.toastService.error(err.error?.message || 'Failed to update event');
							return of(undefined);
						})
					)
				);
			} else {
				return firstValueFrom(
					this.eventService.createEvent(payload).pipe(
						switchMap(() => {
							this.toastService.success('Event created successfully');
							this.router.navigate(['../'], { relativeTo: this.activatedRoute });
							return of(undefined);
						}),
						catchError((err) => {
							this.toastService.error(err.error?.message || 'Failed to create event');
							return of(undefined);
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
