import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: 'login',    loadComponent: () => import('./login/login.component').then(c => c.LoginComponent) },
  // { path: 'register', loadComponent: () => import('./register.component').then(c => c.RegisterComponent) },
  { path: '',         redirectTo: 'login', pathMatch: 'full' },
];

@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] })
export class AuthRoutingModule {}