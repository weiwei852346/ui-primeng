import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { VirtualTarget } from '../shared/models/virtual-target.interface';
import { VirtualTargetControlService } from '../core/services/virtual-target-control.service';
import { VirtualTargetManagerService } from '../core/services/virtual-target-manager.service';

@Component({
  selector: 'app-virtual-targets',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    RadioButtonModule,
    CheckboxModule,
    DialogModule,
    DropdownModule
  ],
  templateUrl: './virtual-targets.component.html',
  styleUrls: ['./virtual-targets.component.scss']
})
export class VirtualTargetsComponent implements OnInit, OnDestroy {
  tableLoading = true;
  tableRows: VirtualTarget[] = [];
  pagination = { total: 0, offset: 0, pageSize: 50 };
  platformFilter: 'Physical' | 'Virtual' = 'Physical';
  searchText = '';
  showFavoritesOnly = false;
  sortBy = { column: 'name', order: 'ASC' };

  // View mode: 'list' or 'columns'
  viewMode: 'list' | 'columns' = 'list';
  // Currently selected target for column view
  selectedTargetForDetail: VirtualTarget | null = null;

  showReserveDialog = false;
  selectedTarget: VirtualTarget | null = null;

  showAddDialog = false;
  newTarget: Partial<VirtualTarget> = {};
  addDialogPage: 1 | 2 = 1;

  showRemoveDialog = false;
  targetToRemove: VirtualTarget | null = null;
  architectureOptions = [
    { label: 'ARM', value: 'ARM' },
    { label: 'X86_64', value: 'X86_64' }
  ];
  osOptions = [
    { label: 'Linux', value: 'Linux' },
    { label: 'Harmony', value: 'Harmony' },
    { label: 'Android', value: 'Android' }
  ];
  typeOptions = [
    { label: 'Physical', value: 'Physical' },
    { label: 'Virtual', value: 'Virtual' }
  ];

  constructor(
    private virtualTargetControlService: VirtualTargetControlService,
    private virtualTargetManagerService: VirtualTargetManagerService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadData();

    // Listen for target release events
    window.addEventListener('targetReleased', this.handleTargetReleased.bind(this));
  }

  ngOnDestroy() {
    window.removeEventListener('targetReleased', this.handleTargetReleased.bind(this));
  }

  handleTargetReleased(event: any) {
    const targetId = event.detail.targetId;
    this.virtualTargetControlService.updateTargetStatus(targetId, 'available');
    const target = this.tableRows.find(t => t.id === targetId);
    if (target) {
      target.status = 'available';
    }
  }

  loadData() {
    this.tableLoading = true;

    const filters = {
      platform: this.platformFilter,
      targetName: this.searchText,
      showFavoritesOnly: this.showFavoritesOnly,
      sortBy: this.sortBy
    };

    this.virtualTargetControlService
      .getVirtualTargetTemplates(filters, this.pagination)
      .subscribe(response => {
        this.tableRows = response.data;
        this.pagination.total = response.total || 0;
        this.tableLoading = false;
      });
  }

  onPlatformChange() {
    this.loadData();
  }

  onSearch() {
    this.loadData();
  }

  onShowFavoritesChange() {
    this.loadData();
  }

  onSort(event: any) {
    this.sortBy.column = event.field;
    this.sortBy.order = event.order === 1 ? 'ASC' : 'DESC';
    this.loadData();
  }

  setViewMode(mode: 'list' | 'columns') {
    this.viewMode = mode;
    // Clear selection when switching views
    if (mode === 'list') {
      this.selectedTargetForDetail = null;
    }
  }

  onRowClick(target: VirtualTarget) {
    if (this.viewMode === 'columns') {
      this.selectedTargetForDetail = target;
    }
  }

  toggleFavorite(row: VirtualTarget) {
    row.favorite = !row.favorite;
    this.virtualTargetControlService.updateFavorite(row.id, row.favorite);

    if (row.favorite) {
      this.virtualTargetManagerService.addFavorite(row.id).subscribe();
    } else {
      this.virtualTargetManagerService.deleteFavorite(row.id).subscribe();
    }
  }

  onReserve(target: VirtualTarget): void {
    this.selectedTarget = target;
    this.showReserveDialog = true;
  }

  confirmReserve(): void {
    if (this.selectedTarget) {
      // Update status to in_use
      this.selectedTarget.status = 'in_use';
      this.virtualTargetControlService.updateTargetStatus(this.selectedTarget.id, 'in_use');

      // Add to reserved targets list
      const reservedTarget = {
        ...this.selectedTarget,
        reservedAt: new Date(),
        reservedBy: 'Current User' // TODO: Replace with actual user
      };

      // Save to localStorage
      const stored = localStorage.getItem('reservedTargets');
      const reservedTargets = stored ? JSON.parse(stored) : [];
      reservedTargets.push(reservedTarget);
      localStorage.setItem('reservedTargets', JSON.stringify(reservedTargets));

      this.showReserveDialog = false;

      // Navigate to My Reservation page
      this.router.navigate(['/my-reservation']);
    }
  }

  cancelReserve(): void {
    this.showReserveDialog = false;
    this.selectedTarget = null;
  }

  openAddDialog(): void {
    this.newTarget = {};
    this.addDialogPage = 1;
    this.showAddDialog = true;
  }

  nextPage(): void {
    this.addDialogPage = 2;
  }

  prevPage(): void {
    this.addDialogPage = 1;
  }

  confirmAdd(): void {
    const target: VirtualTarget = {
      id: crypto.randomUUID(),
      name: this.newTarget.name || '',
      barcode: '',
      target_type: this.newTarget.target_type || '',
      createdBy: this.newTarget.createdBy || '',
      architecture: this.newTarget.architecture || '',
      os: this.newTarget.os || '',
      platform: this.platformFilter,
      favorite: false,
      is_singleton: false,
      isReservable: true,
      status: 'available',
      gateway: this.newTarget.gateway,
      ip: this.newTarget.ip,
      user: this.newTarget.user,
      pass: this.newTarget.pass
    };
    this.virtualTargetControlService.addVirtualTarget(target);
    this.showAddDialog = false;
    this.loadData();
  }

  cancelAdd(): void {
    this.showAddDialog = false;
    this.newTarget = {};
    this.addDialogPage = 1;
  }

  onRemove(target: VirtualTarget): void {
    this.targetToRemove = target;
    this.showRemoveDialog = true;
  }

  confirmRemove(): void {
    if (this.targetToRemove) {
      this.virtualTargetControlService.removeVirtualTarget(this.targetToRemove.id);
      this.showRemoveDialog = false;
      this.targetToRemove = null;
      this.loadData();
    }
  }

  cancelRemove(): void {
    this.showRemoveDialog = false;
    this.targetToRemove = null;
  }
}
