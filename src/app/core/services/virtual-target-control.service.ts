import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ApiResponse } from '../../shared/models/api-response.interface';
import { VirtualTarget } from '../../shared/models/virtual-target.interface';

@Injectable({
  providedIn: 'root'
})
export class VirtualTargetControlService {
  private mockVirtualTargets: VirtualTarget[] = [
    {
      id: '1',
      name: 'SIMICS-Target-001',
      barcode: 'ST-001',
      target_type: 'SIMICS',
      createdBy: 'admin',
      architecture: 'x86_64',
      os: 'Linux',
      platform: 'SIMICS',
      version: '6.0.185',
      favorite: false,
      is_singleton: false,
      isReservable: true
    },
    {
      id: '2',
      name: 'QEMU-Target-001',
      barcode: 'QT-001',
      target_type: 'QEMU',
      createdBy: 'user1',
      architecture: 'aarch64',
      os: 'Linux',
      platform: 'QEMU',
      version: '7.2.0',
      favorite: true,
      is_singleton: true,
      isReservable: true
    },
    {
      id: '3',
      name: 'SIMICS-Target-002',
      barcode: 'ST-002',
      target_type: 'SIMICS',
      createdBy: 'admin',
      architecture: 'x86_64',
      os: 'VxWorks',
      platform: 'SIMICS',
      version: '6.0.185',
      favorite: false,
      is_singleton: false,
      isReservable: true
    },
    {
      id: '4',
      name: 'QEMU-Target-002',
      barcode: 'QT-002',
      target_type: 'QEMU',
      createdBy: '',
      architecture: 'arm',
      os: 'Linux',
      platform: 'QEMU',
      version: '7.2.0',
      favorite: false,
      is_singleton: false,
      isReservable: false
    },
    {
      id: '5',
      name: 'SIMICS-Target-003',
      barcode: 'ST-003',
      target_type: 'SIMICS',
      createdBy: 'user2',
      architecture: 'x86_64',
      os: 'Linux',
      platform: 'SIMICS',
      version: '6.0.190',
      favorite: true,
      is_singleton: true,
      isReservable: true
    },
    {
      id: '6',
      name: 'QEMU-Target-003',
      barcode: 'QT-003',
      target_type: 'QEMU',
      createdBy: 'admin',
      architecture: 'aarch64',
      os: 'Ubuntu',
      platform: 'QEMU',
      version: '7.2.0',
      favorite: false,
      is_singleton: false,
      isReservable: true
    },
    {
      id: '7',
      name: 'SIMICS-Target-004',
      barcode: 'ST-004',
      target_type: 'SIMICS',
      createdBy: 'user1',
      architecture: 'x86_64',
      os: 'Linux',
      platform: 'SIMICS',
      version: '6.0.185',
      favorite: false,
      is_singleton: false,
      isReservable: true
    },
    {
      id: '8',
      name: 'QEMU-Target-004',
      barcode: 'QT-004',
      target_type: 'QEMU',
      createdBy: 'user3',
      architecture: 'riscv64',
      os: 'Linux',
      platform: 'QEMU',
      version: '7.2.0',
      favorite: false,
      is_singleton: false,
      isReservable: true
    },
    {
      id: '9',
      name: 'SIMICS-Target-005',
      barcode: 'ST-005',
      target_type: 'SIMICS',
      createdBy: 'admin',
      architecture: 'x86_64',
      os: 'VxWorks',
      platform: 'SIMICS',
      version: '6.0.190',
      favorite: true,
      is_singleton: false,
      isReservable: true
    },
    {
      id: '10',
      name: 'QEMU-Target-005',
      barcode: 'QT-005',
      target_type: 'QEMU',
      createdBy: 'user2',
      architecture: 'aarch64',
      os: 'Debian',
      platform: 'QEMU',
      version: '7.2.0',
      favorite: false,
      is_singleton: true,
      isReservable: true
    },
    {
      id: '11',
      name: 'SIMICS-Target-006',
      barcode: 'ST-006',
      target_type: 'SIMICS',
      createdBy: 'user1',
      architecture: 'x86_64',
      os: 'Linux',
      platform: 'SIMICS',
      version: '6.0.185',
      favorite: false,
      is_singleton: false,
      isReservable: true
    },
    {
      id: '12',
      name: 'QEMU-Target-006',
      barcode: 'QT-006',
      target_type: 'QEMU',
      createdBy: 'admin',
      architecture: 'arm',
      os: 'Linux',
      platform: 'QEMU',
      version: '7.2.0',
      favorite: false,
      is_singleton: false,
      isReservable: true
    }
  ];

  constructor() {}

  getVirtualTargetTemplates(filter: any, pagination?: any): Observable<ApiResponse> {
    let filteredData = [...this.mockVirtualTargets];

    // Filter by platform
    if (filter.platform) {
      filteredData = filteredData.filter(t => t.platform === filter.platform);
    }

    // Filter by search text (name or barcode)
    if (filter.targetName) {
      const searchText = filter.targetName.toLowerCase();
      filteredData = filteredData.filter(t =>
        t.name.toLowerCase().includes(searchText) ||
        t.barcode.toLowerCase().includes(searchText)
      );
    }

    // Filter by favorite
    if (filter.showFavoritesOnly) {
      filteredData = filteredData.filter(t => t.favorite);
    }

    // Sort
    if (filter.sortBy) {
      const { column, order } = filter.sortBy;
      filteredData.sort((a: any, b: any) => {
        const aVal = a[column] || '';
        const bVal = b[column] || '';
        if (order === 'ASC') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    }

    return of({
      status: 'success',
      data: filteredData,
      total: filteredData.length,
      count: filteredData.length
    });
  }

  updateFavorite(targetId: string, isFavorite: boolean): void {
    const target = this.mockVirtualTargets.find(t => t.id === targetId);
    if (target) {
      target.favorite = isFavorite;
    }
  }

  addVirtualTarget(target: VirtualTarget): void {
    this.mockVirtualTargets.unshift(target);
  }

  removeVirtualTarget(targetId: string): void {
    this.mockVirtualTargets = this.mockVirtualTargets.filter(t => t.id !== targetId);
  }

  updateTargetStatus(targetId: string, status: 'available' | 'in_use'): void {
    const target = this.mockVirtualTargets.find(t => t.id === targetId);
    if (target) {
      target.status = status;
    }
  }
}
