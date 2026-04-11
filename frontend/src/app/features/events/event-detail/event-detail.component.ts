import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EventService } from '../../../core/services/event.service';
import { AuthService } from '../../../core/services/auth.service';
import { Event } from '../../../shared/models/event.model';
import { NgClass, DatePipe } from '@angular/common';

declare const L: any; // Leaflet global

@Component({
    selector: 'app-event-detail',
    templateUrl: './event-detail.component.html',
  standalone: true,
    imports: [NgClass, RouterLink, DatePipe]
})
export class EventDetailComponent implements OnInit, AfterViewInit {
  event: Event | null = null;
  loading: boolean = true;
  error: string = '';
  isLoggedIn: boolean = false;
  isParticipant: boolean = false;
  isOrganizer: boolean = false;
  isOwner: boolean = false;
  mapInitialized: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const id = parseInt(this.route.snapshot.paramMap.get('id') || '0', 10);
    this.isLoggedIn = this.authService.isLoggedIn();
    const user = this.authService.getCurrentUser();
    this.isParticipant = user?.role === 'participant';
    this.isOrganizer = user?.role === 'organizer';

    this.eventService.getEvent(id).subscribe({
      next: (ev) => {
        this.event = ev;
        this.loading = false;
        this.isOwner = user?.id === ev.organizer_id;
        if (ev.geo_lat && ev.geo_lng) {
          setTimeout(() => this.initMap(ev.geo_lat!, ev.geo_lng!), 200);
        }
      },
      error: () => {
        this.error = 'Event not found';
        this.loading = false;
      },
    });
  }

  ngAfterViewInit(): void {}

  initMap(lat: number, lng: number): void {
    if (this.mapInitialized || typeof L === 'undefined') return;
    try {
      const map = L.map('event-map').setView([lat, lng], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      L.marker([lat, lng]).addTo(map).bindPopup(this.event?.title || 'Event Location').openPopup();
      this.mapInitialized = true;
    } catch (e) {
      console.warn('Map initialization failed:', e);
    }
  }

  publishEvent(): void {
    if (!this.event) return;
    this.eventService.publishEvent(this.event.id).subscribe({
      next: (ev) => (this.event = ev),
      error: (err) => alert(err.error?.message || 'Failed to publish'),
    });
  }

  cancelEvent(): void {
    if (!this.event || !confirm('Are you sure you want to cancel this event?')) return;
    this.eventService.cancelEvent(this.event.id).subscribe({
      next: (ev) => (this.event = ev),
      error: (err) => alert(err.error?.message || 'Failed to cancel'),
    });
  }

  deleteEvent(): void {
    if (!this.event || !confirm('Are you sure you want to delete this event?')) return;
    this.eventService.deleteEvent(this.event.id).subscribe({
      next: () => this.router.navigate(['/manage/events']),
      error: (err) => alert(err.error?.message || 'Failed to delete'),
    });
  }

  get minTicketPrice(): number {
    if (!this.event?.ticket_types || this.event.ticket_types.length === 0) return 0;
    return Math.min(...this.event.ticket_types.map((t) => t.price));
  }
}
