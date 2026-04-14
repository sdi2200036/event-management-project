import { Component, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ToastService } from '../../../core/services/toast.service';

@Component({
	selector: 'app-export',
	templateUrl: './export.component.html',
	standalone: true,
	imports: []
})
export class ExportComponent {
	private readonly toastService: ToastService = inject(ToastService);

	constructor(private http: HttpClient) {}

	public exportXML(): void {
		this.http
			.get(`${environment.apiUrl}/export/xml`, { responseType: 'text', observe: 'response' })
			.subscribe({
				next: (response: HttpResponse<string>) => {
					const blob: Blob = new Blob([response.body || ''], { type: 'application/xml' });
					this.downloadFile(blob, 'events.xml');
				},
				error: (err) => this.toastService.error(err.error?.message || 'Failed to export XML')
			});
	}

	public exportJSON(): void {
		this.http.get(`${environment.apiUrl}/export/json`, { observe: 'response' }).subscribe({
			next: (response: HttpResponse<any>) => {
				const blob: Blob = new Blob([JSON.stringify(response.body, null, 2)], { type: 'application/json' });
				this.downloadFile(blob, 'events.json');
			},
			error: (err) => this.toastService.error(err.error?.message || 'Failed to export JSON')
		});
	}

	private downloadFile(blob: Blob, filename: string): void {
		const url: string = window.URL.createObjectURL(blob);
		const link: HTMLAnchorElement = document.createElement('a');
		link.href = url;
		link.download = filename;
		link.click();
		window.URL.revokeObjectURL(url);
	}
}
