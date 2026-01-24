import { Routes } from '@angular/router';

export const routes: Routes = [
	{
		path: '',
		pathMatch: 'full',
		loadComponent: () => import('./pages/home.page').then((m) => m.HomePage)
	},
	{
		path: ':slug',
		loadComponent: () => import('./pages/cluster-page').then((m) => m.ClusterPage)
	},
	{
		path: '**',
		redirectTo: ''
	}
];
