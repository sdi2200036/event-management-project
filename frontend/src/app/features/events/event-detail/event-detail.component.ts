import { DatePipe, NgClass } from '@angular/common';
import { Component, computed, input, InputSignal, Signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { EventService } from '../../../core/services/event.service';
import { ModalService } from '../../../core/services/modal.service';
import { ToastService } from '../../../core/services/toast.service';
import { MapViewComponent } from '../../../shared/components/map-view/map-view.component';
import { Event as EventModel } from '../../../shared/models/event.model';

@Component({
	selector: 'app-event-detail',
	templateUrl: './event-detail.component.html',
	standalone: true,
	imports: [NgClass, DatePipe, MapViewComponent]
})
export class EventDetailComponent {
	public readonly eventData: InputSignal<EventModel | undefined> = input<EventModel>();

	public readonly event: Signal<EventModel | undefined> = this.eventData;
	public readonly isLoggedIn: Signal<boolean> = this.authService.isLoggedIn;
	public readonly isParticipant: Signal<boolean> = computed(
		() => this.authService.currentUser()?.role === 'participant'
	);
	public readonly isOrganizer: Signal<boolean> = computed(() => this.authService.currentUser()?.role === 'organizer');
	public readonly isOwner: Signal<boolean> = computed(() => {
		const user = this.authService.currentUser();
		const ev = this.event();
		return !!user && !!ev && user.id === ev.organizer_id;
	});

	public readonly minTicketPrice: Signal<number> = computed(() => {
		const ev = this.event();
		if (!ev || !ev.ticket_types || ev.ticket_types.length === 0) return 0;
		return Math.min(...ev.ticket_types.map((t) => t.price));
	});

	constructor(
		private router: Router,
		private eventService: EventService,
		private authService: AuthService,
		private toastService: ToastService,
		private modalService: ModalService
	) {}

	public goToEditEvent(): void {
		const ev = this.event();
		if (!ev) return;
		this.router.navigate(['/events/manage', ev.id, 'edit']);
	}

	public goToBookEvent(): void {
		const ev = this.event();
		if (!ev) return;
		this.router.navigate(['/bookings', 'new', ev.id]);
	}

	public goToLogin(): void {
		this.router.navigate(['/login']);
	}

	public goToEvents(): void {
		this.router.navigate(['/events']);
	}

	public publishEvent(): void {
		const ev = this.event();
		if (!ev) return;
		this.eventService.publishEvent(ev.id).subscribe({
			next: () => {
				this.toastService.success('Event published successfully');
				this.router.navigate(['/events/manage', ev.id]);
			},
			error: (err) => this.toastService.error(err.error?.message || 'Failed to publish')
		});
	}

	public cancelEvent(): void {
		const ev = this.event();
		if (!ev) return;
		this.modalService.confirm('Are you sure you want to cancel this event?').then((confirmed) => {
			if (!confirmed) return;
			this.eventService.cancelEvent(ev.id).subscribe({
				next: () => {
					this.toastService.warning('Event cancelled');
					this.router.navigate(['/events/manage', ev.id]);
				},
				error: (err) => this.toastService.error(err.error?.message || 'Failed to cancel')
			});
		});
	}

	public deleteEvent(): void {
		const ev = this.event();
		if (!ev) return;
		this.modalService.confirm('Are you sure you want to delete this event?').then((confirmed) => {
			if (!confirmed) return;
			this.eventService.deleteEvent(ev.id).subscribe({
				next: () => {
					this.toastService.warning('Event deleted');
					this.router.navigate(['/events/manage']);
				},
				error: (err) => this.toastService.error(err.error?.message || 'Failed to delete')
			});
		});
	}
}
