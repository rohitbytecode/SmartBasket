import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ProductManagementComponent } from './pages/product-management/product-management.component';
import { CategoryManagementComponent } from './pages/category-management/category-management.component';
import { OrderManagementComponent } from './pages/order-management/order-management.component';
import { AdminLoginComponent } from '../auth/pages/admin-login/admin-login.component';
import { AuthGuard } from '../core/guards/auth.guard';

const routes: Routes = [
    { path: 'login', component: AdminLoginComponent, data: { title: 'Admin Login' } },
    { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard], data: { title: 'Admin Dashboard' } },
    { path: 'products', component: ProductManagementComponent, canActivate: [AuthGuard], data: { title: 'Product Management' } },
    { path: 'categories', component: CategoryManagementComponent, canActivate: [AuthGuard], data: { title: 'Category Management' } },
    { path: 'orders', component: OrderManagementComponent, canActivate: [AuthGuard], data: { title: 'Order Management' } },
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AdminRoutingModule { }
