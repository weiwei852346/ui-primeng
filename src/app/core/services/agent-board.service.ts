import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
export interface AgentParseRequest {
  query: string;
  options?: {
    platforms?: string[];
    architectures?: string[];
    os?: string[];
    statuses?: string[];
  };
}

export interface AgentParsedFilters {
  platform: 'Physical' | 'Virtual' | null;
  architectures: string[];
  os: string[];
  status: 'available' | 'in_use' | null;
  mustBeReservable: boolean | null;
  keywords: string[];
}

export interface AgentParseResult {
  reasoning: string;
  parsedFilters: AgentParsedFilters;
}

interface AgentParseResponse {
  status: string;
  data: AgentParseResult;
}

@Injectable({
  providedIn: 'root'
})
export class AgentBoardService {
  private readonly baseUrl = 'http://localhost:8787';

  constructor(private http: HttpClient) {}

  parseFilters(payload: AgentParseRequest): Observable<AgentParseResponse> {
    return this.http.post<AgentParseResponse>(`${this.baseUrl}/api/agent/parse`, payload);
  }
}
