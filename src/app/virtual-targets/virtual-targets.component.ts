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
import { MenuModule } from 'primeng/menu';
import { VirtualTarget } from '../shared/models/virtual-target.interface';
import { VirtualTargetControlService } from '../core/services/virtual-target-control.service';
import { VirtualTargetManagerService } from '../core/services/virtual-target-manager.service';
import { AgentBoardService, AgentParsedFilters } from '../core/services/agent-board.service';

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
    DropdownModule,
    MenuModule
  ],
  templateUrl: './virtual-targets.component.html',
  styleUrls: ['./virtual-targets.component.scss']
})
export class VirtualTargetsComponent implements OnInit, OnDestroy {
  tableLoading = true;
  aiLoading = false;
  searchMode: 'search' | 'ai' = 'search';
  tableRows: VirtualTarget[] = [];
  pagination = { total: 0, offset: 0, pageSize: 50 };
  platformFilter: 'Physical' | 'Virtual' = 'Physical';
  searchText = '';
  showFavoritesOnly = false;
  aiFilterText = '';
  aiReasoning = '';
  usingAiFilter = false;
  aiParsedFilters: AgentParsedFilters | null = null;
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

  // View Details Dialog
  showViewDetailsDialog = false;
  viewTarget: Partial<VirtualTarget> = {};
  viewDialogPage: 1 | 2 = 1;

  // Edit Target Dialog
  showEditDialog = false;
  editTarget: Partial<VirtualTarget> = {};
  editDialogPage: 1 | 2 = 1;

  // Current row data for menu
  currentMenuRowData: VirtualTarget | null = null;

  // Menu items definition
  menuItems = [
    {
      label: 'View',
      icon: 'pi pi-eye',
      command: () => {
        if (this.currentMenuRowData) {
          this.openViewDetailsDialog(this.currentMenuRowData);
        }
      }
    },
    {
      label: 'Edit',
      icon: 'pi pi-pencil',
      command: () => {
        if (this.currentMenuRowData) {
          this.openEditDialog(this.currentMenuRowData);
        }
      }
    }
  ];

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
  private readonly boundTargetReleased = this.handleTargetReleased.bind(this);

  constructor(
    private virtualTargetControlService: VirtualTargetControlService,
    private virtualTargetManagerService: VirtualTargetManagerService,
    private agentBoardService: AgentBoardService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadData();

    // Listen for target release events
    window.addEventListener('targetReleased', this.boundTargetReleased);
  }

  ngOnDestroy() {
    window.removeEventListener('targetReleased', this.boundTargetReleased);
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

  onPlatformChange(): void {
    if (this.searchMode === 'ai' && this.usingAiFilter && this.aiParsedFilters) {
      this.applyLocalAiFilters(this.aiParsedFilters);
      return;
    }
    this.loadData();
  }

  onSearch(): void {
    this.loadData();
  }

  onShowFavoritesChange(): void {
    if (this.searchMode === 'ai' && this.usingAiFilter && this.aiParsedFilters) {
      this.applyLocalAiFilters(this.aiParsedFilters);
      return;
    }
    this.loadData();
  }

  onSort(event: any) {
    this.sortBy.column = event.field;
    this.sortBy.order = event.order === 1 ? 'ASC' : 'DESC';
    if (this.searchMode === 'ai' && this.usingAiFilter && this.aiParsedFilters) {
      this.applyLocalAiFilters(this.aiParsedFilters);
      return;
    }
    this.loadData();
  }

  onSearchModeChange(): void {
    if (this.searchMode === 'search') {
      this.usingAiFilter = false;
      this.aiParsedFilters = null;
      this.aiReasoning = '';
      this.aiLoading = false;
      this.loadData();
      return;
    }

    this.searchText = '';
    this.loadData();
  }

  applyAiFilter(): void {
    if (this.aiLoading) {
      return;
    }

    this.tableLoading = true;
    this.aiLoading = true;

    this.agentBoardService
      .parseFilters({
        query: this.aiFilterText.trim(),
        options: {
          platforms: ['Physical', 'Virtual'],
          architectures: ['X86_64', 'ARM', 'aarch64', 'riscv64'],
          os: ['Linux', 'Ubuntu', 'Debian', 'VxWorks', 'Harmony', 'Android'],
          statuses: ['available', 'in_use']
        }
      })
      .subscribe({
        next: (response) => {
          this.usingAiFilter = true;
          this.aiParsedFilters = response.data.parsedFilters;
          this.aiReasoning = response.data.reasoning;
          this.applyLocalAiFilters(response.data.parsedFilters);
        },
        error: (error: unknown) => {
          const fallbackMessage = error instanceof Error ? error.message : 'Agent request failed';
          this.aiReasoning = `Agent filter failed: ${fallbackMessage}`;
          this.tableLoading = false;
          this.aiLoading = false;
        }
      });
  }

  clearAiFilter(): void {
    this.usingAiFilter = false;
    this.aiParsedFilters = null;
    this.aiReasoning = '';
    this.aiFilterText = '';
    this.loadData();
  }

  private applyLocalAiFilters(parsedFilters: AgentParsedFilters): void {
    this.tableLoading = true;

    const baseFilters = {
      platform: this.platformFilter,
      targetName: '',
      showFavoritesOnly: this.showFavoritesOnly,
      sortBy: this.sortBy
    };

    this.virtualTargetControlService
      .getVirtualTargetTemplates(baseFilters, this.pagination)
      .subscribe({
        next: (response) => {
          const filteredRows = response.data.filter((target) =>
            this.matchesAiFilters(target, parsedFilters)
          );

          this.tableRows = filteredRows;
          this.pagination.total = filteredRows.length;
          this.tableLoading = false;
          this.aiLoading = false;
        },
        error: () => {
          this.tableRows = [];
          this.pagination.total = 0;
          this.tableLoading = false;
          this.aiLoading = false;
        }
      });
  }

  private matchesAiFilters(target: VirtualTarget, parsedFilters: AgentParsedFilters): boolean {
    if (parsedFilters.platform && target.platform !== parsedFilters.platform) {
      return false;
    }

    if (
      parsedFilters.architectures.length > 0 &&
      !parsedFilters.architectures.includes(target.architecture || '')
    ) {
      return false;
    }

    if (parsedFilters.os.length > 0 && !parsedFilters.os.includes(target.os || '')) {
      return false;
    }

    if (parsedFilters.status && target.status !== parsedFilters.status) {
      return false;
    }

    if (parsedFilters.mustBeReservable !== null && target.isReservable !== parsedFilters.mustBeReservable) {
      return false;
    }

    if (parsedFilters.keywords.length > 0) {
      const haystack = `${target.name} ${target.barcode} ${target.architecture || ''} ${target.os || ''} ${target.createdBy || ''} ${target.target_type}`.toLowerCase();
      const hasKeyword = parsedFilters.keywords.some((keyword) =>
        haystack.includes(String(keyword).toLowerCase())
      );
      if (!hasKeyword) {
        return false;
      }
    }

    return true;
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

  // View Details Dialog Methods
  openViewDetailsDialog(target: VirtualTarget): void {
    this.viewTarget = { ...target };
    this.viewDialogPage = 1;
    this.showViewDetailsDialog = true;
  }

  viewNextPage(): void {
    this.viewDialogPage = 2;
  }

  viewPrevPage(): void {
    this.viewDialogPage = 1;
  }

  confirmViewDetails(): void {
    this.showViewDetailsDialog = false;
    this.viewTarget = {};
    this.viewDialogPage = 1;
  }

  cancelViewDetails(): void {
    this.showViewDetailsDialog = false;
    this.viewTarget = {};
    this.viewDialogPage = 1;
  }

  // Edit Target Dialog Methods
  openEditDialog(target: VirtualTarget): void {
    this.editTarget = { ...target };
    this.editDialogPage = 1;
    this.showEditDialog = true;
  }

  editNextPage(): void {
    this.editDialogPage = 2;
  }

  editPrevPage(): void {
    this.editDialogPage = 1;
  }

  saveEdit(): void {
    const updatedTarget: VirtualTarget = {
      ...this.editTarget as VirtualTarget,
      id: this.editTarget.id || '',
      name: this.editTarget.name || '',
      barcode: this.editTarget.barcode || '',
      target_type: this.editTarget.target_type || '',
      createdBy: this.editTarget.createdBy || '',
      architecture: this.editTarget.architecture,
      os: this.editTarget.os,
      platform: this.editTarget.platform || this.platformFilter,
      favorite: this.editTarget.favorite || false,
      is_singleton: this.editTarget.is_singleton || false,
      isReservable: this.editTarget.isReservable || true,
      status: this.editTarget.status,
      gateway: this.editTarget.gateway,
      ip: this.editTarget.ip,
      user: this.editTarget.user,
      pass: this.editTarget.pass
    };

    // Update the target in the service
    this.virtualTargetControlService.updateVirtualTarget(updatedTarget);

    this.showEditDialog = false;
    this.editTarget = {};
    this.editDialogPage = 1;
    this.loadData();
  }

  cancelEdit(): void {
    this.showEditDialog = false;
    this.editTarget = {};
    this.editDialogPage = 1;
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
