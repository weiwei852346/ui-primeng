export interface ApiResponse {
  status: string;
  data: any[];
  total?: number;
  count?: number;
  message?: string;
}
