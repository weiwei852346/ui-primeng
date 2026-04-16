import { Routes } from '@angular/router';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout.component';
import { VirtualTargetsComponent } from './virtual-targets/virtual-targets.component';
import { MyReservationComponent } from './my-reservation/my-reservation.component';
import { TerminalInteractionComponent } from './terminal-interaction/terminal-interaction.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', redirectTo: 'virtual-targets', pathMatch: 'full' },
      { path: 'virtual-targets', component: VirtualTargetsComponent },
      { path: 'my-reservation', component: MyReservationComponent },
      { path: 'terminal-interaction', component: TerminalInteractionComponent }
    ]
  }
];
