import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    template: `
    <div class="auth-page">
      <div class="auth-container">
        <div class="auth-header">
          <h1>Form Builder</h1>
          <p class="text-muted">Crie sua conta gratuitamente</p>
        </div>

        <form (ngSubmit)="register()" class="auth-form">
          <div *ngIf="error" class="alert alert-error">
            {{ error }}
          </div>

          <div *ngIf="success" class="alert alert-success">
            {{ success }}
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
                   placeholder="Mínimo 6 caracteres"
                   minlength="6"
                   required>
          </div>

          <div class="form-group">
            <label class="form-label" for="confirmPassword">Confirmar Senha</label>
            <input type="password" 
                   id="confirmPassword" 
                   class="form-input" 
                   [(ngModel)]="confirmPassword"
                   name="confirmPassword"
                   placeholder="Repita a senha"
                   required>
          </div>

          <button type="submit" class="btn btn-primary btn-block" [disabled]="loading">
            {{ loading ? 'Criando conta...' : 'Criar Conta' }}
          </button>
        </form>

        <div class="auth-footer">
          <p>
            Já tem uma conta? 
            <a routerLink="/login">Entrar</a>
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
export class RegisterComponent {
    email = '';
    password = '';
    confirmPassword = '';
    loading = false;
    error = '';
    success = '';

    constructor(
        private authService: AuthService,
        private router: Router
    ) { }

    async register() {
        this.error = '';
        this.success = '';

        if (!this.email || !this.password || !this.confirmPassword) {
            this.error = 'Preencha todos os campos';
            return;
        }

        if (this.password.length < 6) {
            this.error = 'A senha deve ter pelo menos 6 caracteres';
            return;
        }

        if (this.password !== this.confirmPassword) {
            this.error = 'As senhas não conferem';
            return;
        }

        try {
            this.loading = true;
            await this.authService.signUp(this.email, this.password);
            this.success = 'Conta criada! Verifique seu e-mail para confirmar o cadastro.';

            // Limpar campos
            this.email = '';
            this.password = '';
            this.confirmPassword = '';
        } catch (error: any) {
            console.error('Erro no cadastro:', error);
            this.error = error.message || 'Erro ao criar conta. Tente novamente.';
        } finally {
            this.loading = false;
        }
    }
}
