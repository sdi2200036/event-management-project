import { DatePipe, NgClass } from '@angular/common';
import { afterNextRender, Component, computed, effect, input, Signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { EventService } from '../../../core/services/event.service';
import { Event as EventModel } from '../../../shared/models/event.model';

declare const L: any; // Leaflet global

@Component({
	selector: 'app-event-detail',
	templateUrl: './event-detail.component.html',
	standalone: true,
	imports: [NgClass, DatePipe]
})
export class EventDetailComponent {
	readonly eventData = input<EventModel>();

	readonly event: Signal<EventModel | undefined> = this.eventData;
	readonly isLoggedIn: Signal<boolean> = this.authService.isLoggedIn;
	readonly isParticipant: Signal<boolean> = computed(() => this.authService.currentUser()?.role === 'participant');
	readonly isOrganizer: Signal<boolean> = computed(() => this.authService.currentUser()?.role === 'organizer');
	readonly isOwner: Signal<boolean> = computed(() => {
		const user = this.authService.currentUser();
		const ev = this.event();
		return !!user && !!ev && user.id === ev.organizer_id;
	});

	readonly minTicketPrice: Signal<number> = computed(() => {
		const ev = this.event();
		if (!ev || !ev.ticket_types || ev.ticket_types.length === 0) return 0;
		return Math.min(...ev.ticket_types.map((t) => t.price));
	});

	private mapInitialized = false;

	constructor(
		private router: Router,
		private eventService: EventService,
		private authService: AuthService
	) {
		afterNextRender(() => {
			const ev = this.event();
			if (ev?.geo_lat && ev?.geo_lng) {
				this.initMap(ev.geo_lat, ev.geo_lng);
			}
		});
	}

	goToEditEvent(): void {
		const ev = this.event();
		if (!ev) return;
		this.router.navigate(['/manage/events', ev.id, 'edit']);
	}

	goToBookEvent(): void {
		const ev = this.event();
		if (!ev) return;
		this.router.navigate(['/events', ev.id, 'book']);
	}

	goToLogin(): void {
		this.router.navigate(['/login']);
	}

	goToEvents(): void {
		this.router.navigate(['/events']);
	}

	initMap(lat: number, lng: number): void {
		if (this.mapInitialized || typeof L === 'undefined') return;
		try {
			const map = L.map('event-map').setView([lat, lng], 15);
			L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
			}).addTo(map);
			L.marker([lat, lng])
				.addTo(map)
				.bindPopup(this.event()?.title || 'Event Location')
				.openPopup();
			this.mapInitialized = true;
		} catch (e) {
			console.warn('Map initialization failed:', e);
		}
	}

	publishEvent(): void {
		const ev = this.event();
		if (!ev) return;
		this.eventService.publishEvent(ev.id).subscribe({
			next: () => this.router.navigate(['/manage/events', ev.id]),
			error: (err) => alert(err.error?.message || 'Failed to publish')
		});
	}

	cancelEvent(): void {
		const ev = this.event();
		if (!ev || !confirm('Are you sure you want to cancel this event?')) return;
		this.eventService.cancelEvent(ev.id).subscribe({
			next: () => this.router.navigate(['/manage/events', ev.id]),
			error: (err) => alert(err.error?.message || 'Failed to cancel')
		});
	}

	deleteEvent(): void {
		const ev = this.event();
		if (!ev || !confirm('Are you sure you want to delete this event?')) return;
		this.eventService.deleteEvent(ev.id).subscribe({
			next: () => this.router.navigate(['/manage/events']),
			error: (err) => alert(err.error?.message || 'Failed to delete')
		});
	}
}
