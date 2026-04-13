import { Component } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
	selector: 'app-export',
	templateUrl: './export.component.html',
	standalone: true,
	imports: []
})
export class ExportComponent {
	error: string = '';

	constructor(private http: HttpClient) {}

	exportXML(): void {
		this.error = '';
		this.http
			.get(`${environment.apiUrl}/export/xml`, { responseType: 'text', observe: 'response' })
			.subscribe({
				next: (response: HttpResponse<string>) => {
					const blob = new Blob([response.body || ''], { type: 'application/xml' });
					this.downloadFile(blob, 'events.xml');
				},
				error: (err) => (this.error = err.error?.message || 'Failed to export XML')
			});
	}

	exportJSON(): void {
		this.error = '';
		this.http.get(`${environment.apiUrl}/export/json`, { observe: 'response' }).subscribe({
			next: (response: HttpResponse<any>) => {
				const blob = new Blob([JSON.stringify(response.body, null, 2)], { type: 'application/json' });
				this.downloadFile(blob, 'events.json');
			},
			error: (err) => (this.error = err.error?.message || 'Failed to export JSON')
		});
	}

	private downloadFile(blob: Blob, filename: string): void {
		const url = window.URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = filename;
		link.click();
		window.URL.revokeObjectURL(url);
	}
}
