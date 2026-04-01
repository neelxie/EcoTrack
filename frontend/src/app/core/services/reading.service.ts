import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Reading, ReadingSummary, PaginatedResponse } from '../models';

export interface ReadingFilter {
  metric?: string;
  from?: string;
  to?: string;
  page?: number;
}

@Injectable({ providedIn: 'root' })
export class ReadingService {
  constructor(private http: HttpClient) {}

  private base(stationId: number) {
    return `${environment.apiUrl}/stations/${stationId}/readings`;
  }

  list(
    stationId: number,
    filter: ReadingFilter = {},
  ): Observable<PaginatedResponse<Reading>> {
    let params = new HttpParams();
    if (filter.metric) params = params.set('metric', filter.metric);
    if (filter.from) params = params.set('from', filter.from);
    if (filter.to) params = params.set('to', filter.to);
    if (filter.page) params = params.set('page', filter.page.toString());
    return this.http.get<PaginatedResponse<Reading>>(this.base(stationId), {
      params,
    });
  }

  summary(
    stationId: number,
    from: string,
    to: string,
  ): Observable<ReadingSummary[]> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<ReadingSummary[]>(`${this.base(stationId)}/summary`, {
      params,
    });
  }
}
