import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    template: `
    <div class="auth-page">
      <div class="auth-container">
        <div class="auth-header">
          <h1>Form Builder</h1>
          <p class="text-muted">Entre na sua conta para continuar</p>
        </div>

        <form (ngSubmit)="login()" class="auth-form">
          <div *ngIf="error" class="alert alert-error">
            {{ error }}
          </div>

          <div class="form-group">
            <label class="form-label" for="email">E-mail</label>
            <input type="email" 
                   id="email" 
                   class="form-input" 
                   [(ngModel)]="email"
                   name="email"
                   placeholder="seu@email.com"
                   required>
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Senha</label>
            <input type="password" 
                   id="password" 
                   class="form-input" 
                   [(ngModel)]="password"
                   name="password"
                   placeholder="••••••••"
                   required>
          </div>

          <button type="submit" class="btn btn-primary btn-block" [disabled]="loading">
            {{ loading ? 'Entrando...' : 'Entrar' }}
          </button>
        </form>

        <div class="auth-footer">
          <p>
            Não tem uma conta? 
            <a routerLink="/register">Cadastre-se</a>
          </p>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .auth-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--color-gray-50);
      padding: var(--spacing-4);
    }
    
    .auth-container {
      width: 100%;
      max-width: 400px;
      background-color: var(--color-white);
      border-radius: var(--border-radius-lg);
      box-shadow: var(--shadow-md);
      padding: var(--spacing-8);
    }
    
    .auth-header {
      text-align: center;
      margin-bottom: var(--spacing-8);
      
      h1 {
        margin-bottom: var(--spacing-2);
        color: var(--color-primary);
      }
    }
    
    .auth-form {
      margin-bottom: var(--spacing-6);
    }
    
    .auth-footer {
      text-align: center;
      
      p {
        margin: 0;
        color: var(--color-gray-600);
        font-size: var(--font-size-sm);
      }
    }
  `]
})
export class LoginComponent {
    email = '';
    password = '';
    loading = false;
    error = '';

    constructor(private authService: AuthService) { }

    async login() {
        if (!this.email || !this.password) {
            this.error = 'Preencha e-mail e senha';
            return;
        }

        try {
            this.loading = true;
            this.error = '';
            await this.authService.signIn(this.email, this.password);
        } catch (error: any) {
            console.error('Erro no login:', error);
            this.error = error.message || 'Erro ao fazer login. Verifique suas credenciais.';
        } finally {
            this.loading = false;
        }
    }
}
