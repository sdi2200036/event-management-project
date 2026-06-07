import {
	afterNextRender,
	Component,
	ElementRef,
	input,
	InputSignal,
	output,
	OutputEmitterRef,
	signal,
	viewChild,
	WritableSignal
} from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

declare const L: any;

export interface LatLng {
	lat: number;
	lng: number;
}

@Component({
	selector: 'app-map-picker',
	templateUrl: './map-picker.component.html',
	standalone: true
})
export class MapPickerComponent {
	public readonly initialLat: InputSignal<number | null> = input<number | null>(null);
	public readonly initialLng: InputSignal<number | null> = input<number | null>(null);
	public readonly coordsChange: OutputEmitterRef<LatLng | null> = output<LatLng | null>();

	private readonly mapContainer = viewChild.required<ElementRef<HTMLDivElement>>('mapContainer');
	private readonly mapSearchInput = viewChild<ElementRef<HTMLInputElement>>('mapSearchInput');

	public readonly searchingAddress: WritableSignal<boolean> = signal(false);
	public readonly pinnedLat: WritableSignal<number | null> = signal(null);
	public readonly pinnedLng: WritableSignal<number | null> = signal(null);

	private map: any = null;
	private marker: any = null;

	constructor(private readonly toastService: ToastService) {
		afterNextRender(() => this.initMap());
	}

	private initMap(): void {
		if (typeof L === 'undefined') return;

		const lat = this.initialLat();
		const lng = this.initialLng();
		const centerLat = lat ?? 37.9838;
		const centerLng = lng ?? 23.7275;
		const zoom = lat && lng ? 15 : 6;

		this.pinnedLat.set(lat);
		this.pinnedLng.set(lng);

		try {
			this.map = L.map(this.mapContainer().nativeElement).setView([centerLat, centerLng], zoom);
			L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
			}).addTo(this.map);

			if (lat && lng) {
				this.placeMarker(lat, lng);
			}

			this.map.on('click', (e: any) => {
				this.placeMarker(e.latlng.lat, e.latlng.lng);
				this.emitCoords(e.latlng.lat, e.latlng.lng);
			});
		} catch (e) {
			console.warn('Map picker initialization failed:', e);
		}
	}

	private placeMarker(lat: number, lng: number): void {
		if (this.marker) {
			this.marker.setLatLng([lat, lng]);
		} else {
			this.marker = L.marker([lat, lng], { draggable: true }).addTo(this.map);
			this.marker.on('dragend', () => {
				const pos = this.marker.getLatLng();
				this.emitCoords(pos.lat, pos.lng);
			});
		}
	}

	private emitCoords(lat: number, lng: number): void {
		const rounded: LatLng = {
			lat: Math.round(lat * 1000000) / 1000000,
			lng: Math.round(lng * 1000000) / 1000000
		};
		this.pinnedLat.set(rounded.lat);
		this.pinnedLng.set(rounded.lng);
		this.coordsChange.emit(rounded);
	}

	public searchAddress(): void {
		const inputEl = this.mapSearchInput();
		if (!inputEl) return;

		const query = inputEl.nativeElement.value.trim();
		if (!query) return;

		this.searchingAddress.set(true);
		fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`)
			.then((res) => res.json())
			.then((results: Array<{ lat: string; lon: string }>) => {
				if (results.length > 0) {
					const lat = parseFloat(results[0].lat);
					const lng = parseFloat(results[0].lon);
					this.map?.setView([lat, lng], 16);
					this.placeMarker(lat, lng);
					this.emitCoords(lat, lng);
				} else {
					this.toastService.warning('Address not found. Try a different search term.');
				}
				this.searchingAddress.set(false);
			})
			.catch(() => {
				this.toastService.error('Failed to search address. Please try again.');
				this.searchingAddress.set(false);
			});
	}

	public clearPin(): void {
		if (this.marker) {
			this.map?.removeLayer(this.marker);
			this.marker = null;
		}
		this.pinnedLat.set(null);
		this.pinnedLng.set(null);
		this.coordsChange.emit(null);
	}
}
