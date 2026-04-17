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
      name: 'Physical-Target-001',
      barcode: 'ST-001',
      target_type: 'Physical',
      createdBy: 'admin',
      architecture: 'x86_64',
      os: 'Linux',
      platform: 'Physical',
      version: '6.0.185',
      favorite: false,
      is_singleton: false,
      isReservable: true,
      gateway: '127.0.0.1:3000',
      ip: '192.168.1.100',
      user: 'root',
      pass: 'password123'
    },
    {
      id: '2',
      name: 'Virtual-Target-001',
      barcode: 'QT-001',
      target_type: 'Virtual',
      createdBy: 'user1',
      architecture: 'aarch64',
      os: 'Linux',
      platform: 'Virtual',
      version: '7.2.0',
      favorite: true,
      is_singleton: true,
      isReservable: true,
      gateway: '127.0.0.1:3000',
      ip: '192.168.1.101',
      user: 'ubuntu',
      pass: 'ubuntu123'
    },
    {
      id: '3',
      name: 'Physical-Target-002',
      barcode: 'ST-002',
      target_type: 'Physical',
      createdBy: 'admin',
      architecture: 'x86_64',
      os: 'VxWorks',
      platform: 'Physical',
      version: '6.0.185',
      favorite: false,
      is_singleton: false,
      isReservable: true,
      gateway: '127.0.0.1:3000',
      ip: '192.168.1.102',
      user: 'admin',
      pass: 'admin123'
    },
    {
      id: '4',
      name: 'Virtual-Target-002',
      barcode: 'QT-002',
      target_type: 'Virtual',
      createdBy: '',
      architecture: 'arm',
      os: 'Linux',
      platform: 'Virtual',
      version: '7.2.0',
      favorite: false,
      is_singleton: false,
      isReservable: false,
      gateway: '127.0.0.1:3000',
      ip: '192.168.1.103',
      user: 'testuser',
      pass: 'testpass'
    },
    {
      id: '5',
      name: 'Physical-Target-003',
      barcode: 'ST-003',
      target_type: 'Physical',
      createdBy: 'user2',
      architecture: 'x86_64',
      os: 'Linux',
      platform: 'Physical',
      version: '6.0.190',
      favorite: true,
      is_singleton: true,
      isReservable: true,
      gateway: '127.0.0.1:3000',
      ip: '192.168.1.104',
      user: 'devuser',
      pass: 'devpass123'
    },
    {
      id: '6',
      name: 'Virtual-Target-003',
      barcode: 'QT-003',
      target_type: 'Virtual',
      createdBy: 'admin',
      architecture: 'aarch64',
      os: 'Ubuntu',
      platform: 'Virtual',
      version: '7.2.0',
      favorite: false,
      is_singleton: false,
      isReservable: true,
      gateway: '127.0.0.1:3000',
      ip: '192.168.1.105',
      user: 'ubuntu',
      pass: 'ubuntu456'
    },
    {
      id: '7',
      name: 'Physical-Target-004',
      barcode: 'ST-004',
      target_type: 'Physical',
      createdBy: 'user1',
      architecture: 'x86_64',
      os: 'Linux',
      platform: 'Physical',
      version: '6.0.185',
      favorite: false,
      is_singleton: false,
      isReservable: true,
      gateway: '127.0.0.1:3000',
      ip: '192.168.1.106',
      user: 'sysadmin',
      pass: 'sysadmin123'
    },
    {
      id: '8',
      name: 'Virtual-Target-004',
      barcode: 'QT-004',
      target_type: 'Virtual',
      createdBy: 'user3',
      architecture: 'riscv64',
      os: 'Linux',
      platform: 'Virtual',
      version: '7.2.0',
      favorite: false,
      is_singleton: false,
      isReservable: true,
      gateway: '127.0.0.1:3000',
      ip: '192.168.1.107',
      user: 'riscv',
      pass: 'riscv123'
    },
    {
      id: '9',
      name: 'Physical-Target-005',
      barcode: 'ST-005',
      target_type: 'Physical',
      createdBy: 'admin',
      architecture: 'x86_64',
      os: 'VxWorks',
      platform: 'Physical',
      version: '6.0.190',
      favorite: true,
      is_singleton: false,
      isReservable: true,
      gateway: '127.0.0.1:3000',
      ip: '192.168.1.108',
      user: 'vxadmin',
      pass: 'vxadmin123'
    },
    {
      id: '10',
      name: 'Virtual-Target-005',
      barcode: 'QT-005',
      target_type: 'Virtual',
      createdBy: 'user2',
      architecture: 'aarch64',
      os: 'Debian',
      platform: 'Virtual',
      version: '7.2.0',
      favorite: false,
      is_singleton: true,
      isReservable: true,
      gateway: '127.0.0.1:3000',
      ip: '192.168.1.109',
      user: 'debian',
      pass: 'debian123'
    },
    {
      id: '11',
      name: 'Physical-Target-006',
      barcode: 'ST-006',
      target_type: 'Physical',
      createdBy: 'user1',
      architecture: 'x86_64',
      os: 'Linux',
      platform: 'Physical',
      version: '6.0.185',
      favorite: false,
      is_singleton: false,
      isReservable: true,
      gateway: '127.0.0.1:3000',
      ip: '192.168.1.110',
      user: 'linuxuser',
      pass: 'linux123'
    },
    {
      id: '12',
      name: 'Virtual-Target-006',
      barcode: 'QT-006',
      target_type: 'Virtual',
      createdBy: 'admin',
      architecture: 'arm',
      os: 'Linux',
      platform: 'Virtual',
      version: '7.2.0',
      favorite: false,
      is_singleton: false,
      isReservable: true,
      gateway: '127.0.0.1:3000',
      ip: '192.168.1.111',
      user: 'armuser',
      pass: 'arm123'
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
