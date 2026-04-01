import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Station, PaginatedResponse } from '../models';

export interface StationFilter {
  search?: string;
  type?: string;
  active?: boolean;
  page?: number;
}

@Injectable({ providedIn: 'root' })
export class StationService {
  private base = `${environment.apiUrl}/stations`;

  constructor(private http: HttpClient) {}

  list(filter: StationFilter = {}): Observable<PaginatedResponse<Station>> {
    let params = new HttpParams();
    if (filter.search) params = params.set('search', filter.search);
    if (filter.type) params = params.set('type', filter.type);
    if (filter.active) params = params.set('active', '1');
    if (filter.page) params = params.set('page', filter.page.toString());
    return this.http.get<PaginatedResponse<Station>>(this.base, { params });
  }

  get(id: number): Observable<{ data: Station }> {
    return this.http.get<{ data: Station }>(`${this.base}/${id}`);
  }

  create(payload: Partial<Station>): Observable<{ data: Station }> {
    return this.http.post<{ data: Station }>(this.base, payload);
  }

  update(id: number, payload: Partial<Station>): Observable<{ data: Station }> {
    return this.http.put<{ data: Station }>(`${this.base}/${id}`, payload);
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/${id}`);
  }
}
