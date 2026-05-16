import { DatePipe, NgClass } from '@angular/common';
import { Component, computed, input, InputSignal, Signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { EventService } from '../../../core/services/event.service';
import { ModalService } from '../../../core/services/modal.service';
import { ToastService } from '../../../core/services/toast.service';
import { MapViewComponent } from '../../../shared/components/map-view/map-view.component';
import { Booking } from '../../../shared/models/booking.model';
import { Event as EventModel } from '../../../shared/models/event.model';

@Component({
	selector: 'app-event-detail',
	templateUrl: './event-detail.component.html',
	standalone: true,
	imports: [NgClass, DatePipe, MapViewComponent]
})
export class EventDetailComponent {
	public readonly event: InputSignal<EventModel> = input.required<EventModel>({ alias: 'eventData' });
	public readonly bookings: InputSignal<Booking[]> = input<Booking[]>([], {
		alias: 'bookingsData'
	});
	public readonly isManageMode: InputSignal<boolean> = input<boolean>(false);

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
		private modalService: ModalService,
		private activatedRoute: ActivatedRoute
	) {}

	public goToEditEvent(): void {
		const ev = this.event();
		if (!ev) return;
		this.router.navigate(['events', 'manage', ev.id, 'edit']);
	}

	public goToBookEvent(): void {
		const ev = this.event();
		if (!ev) return;
		this.router.navigate(['bookings', 'new', ev.id]);
	}

	public goToLogin(): void {
		this.router.navigate(['login']);
	}

	public goToEvents(): void {
		this.router.navigate(['events']);
	}

	public messageOrganizer(): void {
		const ev = this.event();
		if (!ev?.organizer_username) return;
		this.router.navigate(['messages'], { queryParams: { receiver: ev.organizer_username } });
	}

	public publishEvent(): void {
		const event = this.event();
		this.modalService
			.confirm(`Publish "${event.title}"? It will become visible to all users.`, 'Publish')
			.then((confirmed) => {
				if (!confirmed) return;
				this.eventService.publishEvent(event.id).subscribe({
					next: () => {
						this.toastService.success(`"${event.title}" published successfully`);
						this.router.navigate([], {
							relativeTo: this.activatedRoute,
							queryParamsHandling: 'preserve',
							onSameUrlNavigation: 'reload'
						});
					},
					error: (err) => this.toastService.error(err.error?.message || 'Failed to publish event')
				});
			});
	}

	public cancelEvent(): void {
		const event = this.event();
		this.modalService.confirm(`Cancel "${event.title}"? This cannot be undone.`).then((confirmed) => {
			if (!confirmed) return;
			this.eventService.cancelEvent(event.id).subscribe({
				next: () => {
					this.toastService.warning(`"${event.title}" cancelled`);
					this.router.navigate([], {
						relativeTo: this.activatedRoute,
						queryParamsHandling: 'preserve',
						onSameUrlNavigation: 'reload'
					});
				},
				error: (err) => this.toastService.error(err.error?.message || 'Failed to cancel event')
			});
		});
	}

	public deleteEvent(): void {
		const event = this.event();
		this.modalService.confirm(`Delete "${event.title}"? This is permanent.`).then((confirmed) => {
			if (!confirmed) return;
			this.eventService.deleteEvent(event.id).subscribe({
				next: () => {
					this.toastService.warning(`"${event.title}" deleted`);
					this.router.navigate([], {
						relativeTo: this.activatedRoute,
						queryParamsHandling: 'preserve',
						onSameUrlNavigation: 'reload'
					});
				},
				error: (err) => this.toastService.error(err.error?.message || 'Failed to delete event')
			});
		});
	}
}
