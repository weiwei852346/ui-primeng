import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, MenuModule, ButtonModule],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent {
  sidebarVisible: boolean = true;
  menuItems: MenuItem[] = [
    {
      label: 'Virtual Targets',
      icon: 'pi pi-server',
      routerLink: ['/virtual-targets']
    },
    {
      label: 'My Reservation',
      icon: 'pi pi-bookmark',
      routerLink: ['/my-reservation']
    }
  ];

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
  }
}
