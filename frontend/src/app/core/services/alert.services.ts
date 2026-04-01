import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, fromEvent, EMPTY } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Alert } from '../models';
import { AuthService } from './auth.services';

@Injectable({ providedIn: 'root' })
export class AlertService {
  private base = `${environment.apiUrl}/alerts`;

  constructor(
    private http: HttpClient,
    private auth: AuthService,
  ) {}

  list(): Observable<Alert[]> {
    return this.http.get<Alert[]>(this.base);
  }

  create(payload: Partial<Alert>): Observable<Alert> {
    return this.http.post<Alert>(this.base, payload);
  }

  update(id: number, payload: Partial<Alert>): Observable<Alert> {
    return this.http.put<Alert>(`${this.base}/${id}`, payload);
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/${id}`);
  }

  streamAlerts(): EventSource | null {
    if (!this.auth.token()) return null;
    return new EventSource(
      `${environment.apiUrl}/alerts/stream?token=${this.auth.token()}`,
    );
  }
}
