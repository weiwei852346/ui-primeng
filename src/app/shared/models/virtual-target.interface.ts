export interface VirtualTarget {
  id: string;
  name: string;
  barcode: string;
  target_type: string;
  createdBy: string;
  architecture?: string;
  os?: string;
  platform: 'Physical' | 'Virtual';
  version?: string;
  favorite: boolean;
  is_singleton: boolean;
  isReservable: boolean;
  status?: 'available' | 'in_use';
  gateway?: string; // WebSocket网关IP和端口
  ip?: string; // 目标IP地址
  user?: string; // 目标用户名
  pass?: string; // 目标密码
}
