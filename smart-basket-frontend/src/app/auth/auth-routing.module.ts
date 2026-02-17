import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ClientAuthComponent } from './pages/client-auth/client-auth.component';

const routes: Routes = [
    { path: 'login', component: ClientAuthComponent, data: { title: 'Login' } }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AuthRoutingModule { }
