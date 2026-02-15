import { NgModule } from '@angular/core';
import { SharedModule } from '@shared/shared.module';
import { AuthRoutingModule } from './auth-routing.module';

import { ClientAuthComponent } from './pages/client-auth/client-auth.component';

@NgModule({
    declarations: [
        ClientAuthComponent
    ],
    imports: [
        SharedModule,
        AuthRoutingModule
    ]
})
export class AuthModule { }
