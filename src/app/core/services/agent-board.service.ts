import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VirtualTarget } from '../../shared/models/virtual-target.interface';

export interface AgentFilterRequest {
  query: string;
  platformFilter: 'Physical' | 'Virtual';
  searchText: string;
  showFavoritesOnly: boolean;
}

export interface AgentParsedFilters {
  platform: 'Physical' | 'Virtual' | null;
  architectures: string[];
  os: string[];
  status: 'available' | 'in_use' | null;
  mustBeReservable: boolean | null;
  keywords: string[];
}

export interface AgentFilterResult {
  total: number;
  reasoning: string;
  parsedFilters: AgentParsedFilters;
  targets: VirtualTarget[];
}

interface AgentFilterResponse {
  status: string;
  data: AgentFilterResult;
}

@Injectable({
  providedIn: 'root'
})
export class AgentBoardService {
  private readonly baseUrl = 'http://localhost:8787';

  constructor(private http: HttpClient) {}

  filterBoards(payload: AgentFilterRequest): Observable<AgentFilterResponse> {
    return this.http.post<AgentFilterResponse>(`${this.baseUrl}/api/agent/filter`, payload);
  }
}
