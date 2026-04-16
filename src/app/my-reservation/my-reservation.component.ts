import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { VirtualTarget } from '../shared/models/virtual-target.interface';

export interface ReservedTarget extends VirtualTarget {
  reservedAt: Date;
  reservedBy: string;
}

@Component({
  selector: 'app-my-reservation',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule
  ],
  templateUrl: './my-reservation.component.html',
  styleUrls: ['./my-reservation.component.scss']
})
export class MyReservationComponent implements OnInit {
  reservedTargets: ReservedTarget[] = [];

  constructor(private router: Router) {}

  ngOnInit() {
    this.loadReservedTargets();
  }

  loadReservedTargets() {
    // Load from localStorage
    const stored = localStorage.getItem('reservedTargets');
    if (stored) {
      this.reservedTargets = JSON.parse(stored);
    }
  }

  onConnect(target: ReservedTarget) {
    this.router.navigate(['/terminal-interaction'], {
      state: { target: target }
    });
  }

  onRelease(target: ReservedTarget) {
    // Remove from reserved list
    this.reservedTargets = this.reservedTargets.filter(t => t.id !== target.id);
    localStorage.setItem('reservedTargets', JSON.stringify(this.reservedTargets));

    // Update the target status back to available in the virtual targets list
    // We need to update the status in localStorage or trigger an event
    const event = new CustomEvent('targetReleased', { detail: { targetId: target.id } });
    window.dispatchEvent(event);
  }
}
