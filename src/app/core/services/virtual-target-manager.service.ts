import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ApiResponse } from '../../shared/models/api-response.interface';

@Injectable({
  providedIn: 'root'
})
export class VirtualTargetManagerService {
  constructor() {}

  addFavorite(targetId: string): Observable<ApiResponse> {
    return of({
      status: 'success',
      data: [{ id: targetId, favorite: true }],
      message: 'Added to favorites'
    });
  }

  deleteFavorite(targetId: string): Observable<ApiResponse> {
    return of({
      status: 'success',
      data: [{ id: targetId, favorite: false }],
      message: 'Removed from favorites'
    });
  }
}
