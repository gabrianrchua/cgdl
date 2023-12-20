import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { CategoryViewComponent } from './category-view/category-view.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: ':id', component: CategoryViewComponent },
    { path: '**', redirectTo: '' }
];
