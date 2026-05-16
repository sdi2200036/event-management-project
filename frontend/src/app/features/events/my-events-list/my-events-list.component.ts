import { DatePipe, NgClass } from '@angular/common';
import { Component, computed, input, InputSignal, Signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService } from 'src/app/core/services/event.service';
import { ModalService } from 'src/app/core/services/modal.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { Event as EventModel, EventsResponseExtended } from 'src/app/shared/models/event.model';

@Component({
	selector: 'app-my-events-list',
	imports: [NgClass, DatePipe],
	templateUrl: './my-events-list.component.html'
})
export class MyEventsListComponent {
	public readonly eventsData: InputSignal<EventsResponseExtended | null | undefined> =
		input<EventsResponseExtended | null>();
	public events: Signal<EventModel[]> = computed(() => this.eventsData()?.events || []);

	constructor(
		private router: Router,
		private eventService: EventService,
		private toastService: ToastService,
		private activatedRoute: ActivatedRoute,
		private modalService: ModalService
	) {}

	public publishEvent(event: EventModel): void {
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

	public cancelEvent(event: EventModel): void {
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

	public deleteEvent(event: EventModel): void {
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

	public goToCreateEvent(): void {
		this.router.navigate(['new'], { relativeTo: this.activatedRoute });
	}

	public goToViewEvent(eventId: number): void {
		this.router.navigate([eventId], { relativeTo: this.activatedRoute });
	}

	public goToEditEvent(eventId: number): void {
		this.router.navigate([eventId, 'edit'], { relativeTo: this.activatedRoute });
	}

	public statusBadgeClass(status: string): string {
		switch (status) {
			case 'PUBLISHED':
				return 'bg-success';
			case 'DRAFT':
				return 'bg-secondary';
			case 'CANCELLED':
				return 'bg-danger';
			case 'COMPLETED':
				return 'bg-info';
			default:
				return 'bg-secondary';
		}
	}
}
