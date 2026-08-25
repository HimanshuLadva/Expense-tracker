import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="profile-container">
      <div class="profile-header">
        <div class="profile-avatar">
          <span class="avatar-icon">👤</span>
        </div>
        <h1 class="profile-title">My Profile</h1>
        <p class="profile-subtitle">View your account information</p>
      </div>

      @if (currentUser) {
        <div class="profile-content">
          <div class="info-card">
            <div class="card-header">
              <h2>Account Information</h2>
            </div>
            <div class="card-body">
              <div class="info-row">
                <div class="info-label">
                  <span class="label-icon">👤</span>
                  <span>Username</span>
                </div>
                <div class="info-value">{{ currentUser.username }}</div>
              </div>

              <div class="info-row">
                <div class="info-label">
                  <span class="label-icon">✉️</span>
                  <span>Email</span>
                </div>
                <div class="info-value">{{ currentUser.email }}</div>
              </div>

              <div class="info-row">
                <div class="info-label">
                  <span class="label-icon">🔒</span>
                  <span>Password</span>
                </div>
                <div class="info-value password-value">
                  <span>••••••••••••</span>
                  <span class="password-note">(Securely encrypted)</span>
                </div>
              </div>

              <div class="info-row">
                <div class="info-label">
                  <span class="label-icon">🛡️</span>
                  <span>Role</span>
                </div>
                <div class="info-value">
                  <span [class]="currentUser.isAdmin ? 'badge badge-admin' : 'badge badge-user'">
                    {{ currentUser.isAdmin ? 'Administrator' : 'User' }}
                  </span>
                </div>
              </div>

              @if (currentUser.createdAt) {
                <div class="info-row">
                  <div class="info-label">
                    <span class="label-icon">📅</span>
                    <span>Member Since</span>
                  </div>
                  <div class="info-value">{{ formatDate(currentUser.createdAt) }}</div>
                </div>
              }
            </div>
          </div>

          <div class="profile-actions">
            <button class="action-btn btn-primary" disabled>
              <span class="btn-icon">✏️</span>
              Edit Profile (Coming Soon)
            </button>
            <button class="action-btn btn-secondary" disabled>
              <span class="btn-icon">🔑</span>
              Change Password (Coming Soon)
            </button>
          </div>
        </div>
      } @else {
        <div class="no-data">
          <p>Loading user information...</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .profile-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }

    .profile-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .profile-avatar {
      width: 120px;
      height: 120px;
      margin: 0 auto 1.5rem;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 30px color-mix(in srgb, var(--color-primary) 30%, transparent);
    }

    .avatar-icon {
      font-size: 4rem;
      filter: brightness(0) invert(1);
    }

    .profile-title {
      font-size: 2rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 0.5rem 0;
    }

    .profile-subtitle {
      color: var(--text-secondary);
      font-size: 1rem;
      margin: 0;
    }

    .profile-content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .info-card {
      background: var(--surface);
      border-radius: 12px;
      box-shadow: var(--shadow-md);
      overflow: hidden;
    }

    .card-header {
      padding: 1.5rem;
      background: linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%);
      border-bottom: 1px solid var(--border-subtle);
    }

    .card-header h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-on-primary);
    }

    .card-body {
      padding: 1.5rem;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 0;
      border-bottom: 1px solid var(--border-subtle);
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .info-label {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-weight: 600;
      color: var(--text-primary);
      font-size: 0.95rem;
    }

    .label-icon {
      font-size: 1.25rem;
      width: 24px;
      display: inline-flex;
      justify-content: center;
    }

    .info-value {
      color: var(--text-primary);
      font-size: 0.95rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .password-value {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .password-note {
      font-size: 0.8rem;
      color: var(--text-secondary);
      font-weight: 400;
      font-style: italic;
    }

    .badge {
      padding: 0.375rem 0.875rem;
      border-radius: 20px;
      font-size: 0.875rem;
      font-weight: 600;
      display: inline-block;
    }

    .badge-admin {
      background: var(--color-warning-tint);
      color: var(--color-warning);
      border: 1px solid color-mix(in srgb, var(--color-warning) 45%, var(--tint-mix-base));
    }

    .badge-user {
      background: var(--color-info-tint);
      color: var(--color-info);
      border: 1px solid color-mix(in srgb, var(--color-info) 45%, var(--tint-mix-base));
    }

    .profile-actions {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .action-btn {
      flex: 1;
      min-width: 200px;
      padding: 0.875rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
      color: var(--text-on-primary);
      box-shadow: 0 4px 12px color-mix(in srgb, var(--color-primary) 30%, transparent);
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px color-mix(in srgb, var(--color-primary) 40%, transparent);
    }

    .btn-secondary {
      background: var(--surface);
      color: var(--color-primary);
      border: 2px solid var(--color-primary);
    }

    .btn-secondary:hover:not(:disabled) {
      background: var(--surface-sunken);
      transform: translateY(-2px);
    }

    .action-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none !important;
    }

    .btn-icon {
      font-size: 1.1rem;
    }

    .no-data {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--text-secondary);
    }

    @media (max-width: 768px) {
      .profile-container {
        padding: 1rem 0.5rem;
      }

      .profile-avatar {
        width: 100px;
        height: 100px;
      }

      .avatar-icon {
        font-size: 3rem;
      }

      .profile-title {
        font-size: 1.5rem;
      }

      .info-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
        padding: 0.875rem 0;
      }

      .info-label {
        font-size: 0.875rem;
      }

      .info-value {
        font-size: 0.875rem;
        padding-left: 2rem;
      }

      .password-value {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.25rem;
      }

      .password-note {
        font-size: 0.75rem;
      }

      .profile-actions {
        flex-direction: column;
      }

      .action-btn {
        min-width: 100%;
      }
    }

    @media (max-width: 480px) {
      .card-header,
      .card-body {
        padding: 1rem;
      }
    }
  `]
})
export class UserProfileComponent implements OnInit, OnDestroy {
  currentUser: Omit<User, 'password'> | null = null;
  private subscription = new Subscription();

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Subscribe to current user observable
    this.subscription.add(
      this.authService.currentUser$.subscribe(user => {
        this.currentUser = user;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
