import { Routes } from '@angular/router';
import { messagesResolver } from 'src/app/core/resolvers/messages.resolver';
import { MessagingComponent } from './messaging.component';

export const MESSAGING_ROUTES: Routes = [
	{
		path: '',
		component: MessagingComponent,
		resolve: { messagesData: messagesResolver },
		runGuardsAndResolvers: 'always'
	}
];
