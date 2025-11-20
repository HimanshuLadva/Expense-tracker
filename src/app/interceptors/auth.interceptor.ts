import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

/**
 * HTTP Interceptor to automatically attach JWT token to requests
 * and handle 401 Unauthorized responses
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // Get token from localStorage
  const token = localStorage.getItem('auth_token');

  // List of endpoints that don't need token
  const publicEndpoints = ['/Signup', '/Login', '/CheckUsername', '/CheckEmail'];
  const isPublicEndpoint = publicEndpoints.some(endpoint => req.url.includes(endpoint));

  // Clone request and add Authorization header if token exists and not public endpoint
  let authReq = req;
  if (token && !isPublicEndpoint) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // Handle the request and catch 401 errors
  return next(authReq).pipe(
    catchError((error) => {
      // Redirect to login on 401 Unauthorized
      if (error.status === 401) {
        // Clear token
        localStorage.removeItem('auth_token');
        localStorage.removeItem('currentUser');

        // Redirect to login
        router.navigate(['/login']);
      }

      return throwError(() => error);
    })
  );
};
