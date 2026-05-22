import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

@Component({
	selector: 'app-toast',
	templateUrl: './toast.component.html',
	styleUrl: './toast.component.css',
	standalone: true,
	imports: [NgClass]
})
export class ToastComponent {
	constructor(public toastService: ToastService) {}
}
