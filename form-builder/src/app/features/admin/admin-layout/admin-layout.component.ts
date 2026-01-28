import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-admin-layout',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="admin-layout">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <h1 class="logo">Form Builder</h1>
        </div>
        
        <nav class="sidebar-nav">
          <a routerLink="/admin/forms" routerLinkActive="active" class="nav-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <span>Formulários</span>
          </a>
        </nav>
        
        <div class="sidebar-footer">
          <span class="version">v1.0.0</span>
        </div>
      </aside>
      
      <!-- Main Content -->
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
    styles: [`
    .admin-layout {
      display: flex;
      min-height: 100vh;
    }
    
    .sidebar {
      width: 260px;
      background-color: var(--color-gray-900);
      color: var(--color-white);
      display: flex;
      flex-direction: column;
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      z-index: var(--z-fixed);
    }
    
    .sidebar-header {
      padding: var(--spacing-6);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .logo {
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-white);
      margin: 0;
    }
    
    .sidebar-nav {
      flex: 1;
      padding: var(--spacing-4);
    }
    
    .nav-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-3);
      padding: var(--spacing-3) var(--spacing-4);
      color: var(--color-gray-300);
      text-decoration: none;
      border-radius: var(--border-radius-md);
      transition: all var(--transition-fast);
      margin-bottom: var(--spacing-1);
      
      &:hover {
        color: var(--color-white);
        background-color: rgba(255, 255, 255, 0.1);
        text-decoration: none;
      }
      
      &.active {
        color: var(--color-white);
        background-color: var(--color-primary);
      }
    }
    
    .sidebar-footer {
      padding: var(--spacing-4);
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .version {
      font-size: var(--font-size-xs);
      color: var(--color-gray-500);
    }
    
    .main-content {
      flex: 1;
      margin-left: 260px;
      padding: var(--spacing-8);
      background-color: var(--color-gray-50);
      min-height: 100vh;
    }
  `]
})
export class AdminLayoutComponent { }
