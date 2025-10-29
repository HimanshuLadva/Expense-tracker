import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CategoryApiService {
  private readonly apiUrl = `${environment.apiUrl}/api/Category`;

  constructor(private http: HttpClient) {}

  /**
   * Get all categories
   * POST /api/Category/GetAll
   */
  getAll(): Observable<Category[]> {
    return this.http.post<Category[]>(`${this.apiUrl}/GetAll`, {});
  }

  /**
   * Get category by ID
   * POST /api/Category/GetById
   */
  getById(id: number): Observable<Category> {
    return this.http.post<Category>(`${this.apiUrl}/GetById`, { id });
  }

  /**
   * Create new category
   * POST /api/Category/Create
   */
  create(request: CreateCategoryRequest): Observable<Category> {
    return this.http.post<Category>(`${this.apiUrl}/Create`, request);
  }

  /**
   * Update existing category
   * POST /api/Category/Update
   */
  update(request: UpdateCategoryRequest): Observable<Category> {
    return this.http.post<Category>(`${this.apiUrl}/Update`, request);
  }

  /**
   * Delete category
   * POST /api/Category/Delete
   */
  delete(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/Delete`, { id });
  }
}
