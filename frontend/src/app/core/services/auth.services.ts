import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, EMPTY } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, AuthResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _user   = signal<User | null>(null);
  private readonly _token  = signal<string | null>(localStorage.getItem('eco_token'));

  readonly user      = this._user.asReadonly();
  readonly token     = this._token.asReadonly();
  readonly isLoggedIn = computed(() => !!this._token());

  constructor(private http: HttpClient, private router: Router) {
    if (this._token()) this.fetchMe();
  }

  login(email: string, password: string) {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, { email, password }).pipe(
      tap(res => this.setSession(res)),
    );
  }

  register(name: string, email: string, password: string, password_confirmation: string) {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`,
      { name, email, password, password_confirmation }).pipe(
      tap(res => this.setSession(res)),
    );
  }

  logout() {
    return this.http.post(`${environment.apiUrl}/auth/logout`, {}).pipe(
      tap(() => this.clearSession()),
      catchError(() => { this.clearSession(); return EMPTY; }),
    );
  }

  private fetchMe() {
    this.http.get<User>(`${environment.apiUrl}/auth/me`).pipe(
      catchError(() => { this.clearSession(); return EMPTY; }),
    ).subscribe(user => this._user.set(user));
  }

  private setSession(res: AuthResponse) {
    localStorage.setItem('eco_token', res.token);
    this._token.set(res.token);
    this._user.set(res.user);
  }

  private clearSession() {
    localStorage.removeItem('eco_token');
    this._token.set(null);
    this._user.set(null);
    this.router.navigate(['/auth/login']);
  }
}