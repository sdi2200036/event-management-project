import { afterNextRender, Component, ElementRef, input, InputSignal, viewChild } from '@angular/core';

declare const L: any;

@Component({
	selector: 'app-map-view',
	templateUrl: './map-view.component.html',
	standalone: true
})
export class MapViewComponent {
	public readonly lat: InputSignal<number> = input.required<number>();
	public readonly lng: InputSignal<number> = input.required<number>();
	public readonly label: InputSignal<string> = input('');
	public readonly height: InputSignal<string> = input('300px');

	private readonly mapContainer = viewChild.required<ElementRef<HTMLDivElement>>('mapContainer');

	constructor() {
		afterNextRender(() => this.initMap());
	}

	private initMap(): void {
		if (typeof L === 'undefined') return;
		try {
			const map = L.map(this.mapContainer().nativeElement).setView([this.lat(), this.lng()], 15);
			L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
			}).addTo(map);
			L.marker([this.lat(), this.lng()])
				.addTo(map)
				.bindPopup(this.label() || 'Event Location')
				.openPopup();
		} catch (e) {
			console.warn('Map initialization failed:', e);
		}
	}
}
