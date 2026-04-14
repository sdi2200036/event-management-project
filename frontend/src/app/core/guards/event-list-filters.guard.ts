import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Params, Router, RouterStateSnapshot } from '@angular/router';
import { EventCategory } from '../../shared/models/event.model';

const validCategories: Set<string> = new Set<string>(Object.values(EventCategory));

function isValidDate(value: string): boolean {
	return !isNaN(Date.parse(value));
}

function isNonNegativeNumber(value: string): boolean {
	const n: number = Number(value);
	return !isNaN(n) && n >= 0;
}

function isPositiveInteger(value: string): boolean {
	const n: number = Number(value);
	return !isNaN(n) && Number.isInteger(n) && n >= 1;
}

export const eventListFiltersGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
	if (state.url.includes('/manage')) {
		return true;
	}

	const router: Router = inject(Router);
	const params: Params = route.queryParams;
	const cleaned: Params = { ...params };
	let hasInvalid: boolean = false;

	if (params['category'] && !validCategories.has(params['category'])) {
		cleaned['category'] = null;
		hasInvalid = true;
	}

	if (params['minPrice'] !== undefined && !isNonNegativeNumber(params['minPrice'])) {
		cleaned['minPrice'] = null;
		hasInvalid = true;
	}

	if (params['maxPrice'] !== undefined && !isNonNegativeNumber(params['maxPrice'])) {
		cleaned['maxPrice'] = null;
		hasInvalid = true;
	}

	if (params['page'] !== undefined && !isPositiveInteger(params['page'])) {
		cleaned['page'] = null;
		hasInvalid = true;
	}

	if (params['dateFrom'] && !isValidDate(params['dateFrom'])) {
		cleaned['dateFrom'] = null;
		hasInvalid = true;
	}

	if (params['dateTo'] && !isValidDate(params['dateTo'])) {
		cleaned['dateTo'] = null;
		hasInvalid = true;
	}

	if (hasInvalid) {
		return router.createUrlTree(['/events'], { queryParams: cleaned });
	}

	return true;
};
