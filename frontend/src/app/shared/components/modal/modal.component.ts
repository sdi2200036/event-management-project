import { NgTemplateOutlet } from '@angular/common';
import { Component } from '@angular/core';
import { ModalService } from '../../../core/services/modal.service';

@Component({
	selector: 'app-modal',
	templateUrl: './modal.component.html',
	styleUrl: './modal.component.css',
	standalone: true,
	imports: [NgTemplateOutlet]
})
export class ModalComponent {
	constructor(public modalService: ModalService) {}
}
