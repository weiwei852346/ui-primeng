export interface VirtualTarget {
  id: string;
  name: string;
  barcode: string;
  target_type: string;
  createdBy: string;
  architecture?: string;
  os?: string;
  platform: 'SIMICS' | 'QEMU';
  version?: string;
  favorite: boolean;
  is_singleton: boolean;
  isReservable: boolean;
  status?: 'available' | 'in_use';
}
