import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { AuthService } from './services/auth.service';
import { ThemeService } from './services/theme.service';
import { User } from './models';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Expense-tracker';
  showSidebar = true;
  sidebarCollapsed = false;
  currentUser: Omit<User, 'password'> | null = null;

  constructor(
    private router: Router,
    public authService: AuthService,
    public themeService: ThemeService
  ) {
    // Hide sidebar on auth pages
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const authRoutes = ['/login', '/signup'];
      // Extract the path without query parameters
      const urlPath = event.url.split('?')[0];
      this.showSidebar = !authRoutes.includes(urlPath);
    });

    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  /**
   * Toggle sidebar between expanded and icon-only collapsed state
   */
  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  /**
   * Cycle theme preference: Light -> Dark -> System -> Light
   */
  cycleTheme(): void {
    this.themeService.cycleTheme();
  }

  /**
   * Handle logout button click
   */
  onLogout(): void {
    this.authService.logout().subscribe({
      next: () => {
        console.log('Logout successful');
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Logout error:', error);
        // Navigate to login even if API call fails
        this.router.navigate(['/login']);
      }
    });
  }
}
