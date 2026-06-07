import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { JwtInterceptor } from './app/core/interceptors/jwt.interceptor';
import { LoadingInterceptor } from './app/core/interceptors/loading.interceptor';
import { AuthGuard } from './app/core/guards/auth.guard';
import { RoleGuard } from './app/core/guards/role.guard';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { AppComponent } from './app/app.component';
import { appRoutes } from './app/app.routes';

bootstrapApplication(AppComponent, {
	providers: [
		provideRouter(
			appRoutes,
			withComponentInputBinding(),
			withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })
		),
		{
			provide: HTTP_INTERCEPTORS,
			useClass: LoadingInterceptor,
			multi: true
		},
		{
			provide: HTTP_INTERCEPTORS,
			useClass: JwtInterceptor,
			multi: true
		},
		AuthGuard,
		RoleGuard,
		provideHttpClient(withInterceptorsFromDi())
	]
}).catch((err) => console.error(err));
