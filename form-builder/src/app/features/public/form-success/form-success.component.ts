import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
    selector: 'app-form-success',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="success-page">
      <div class="success-container">
        <div class="success-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        
        <h1>Formulário Enviado!</h1>
        <p class="text-muted">Suas informações foram recebidas com sucesso.</p>
        
        <div class="success-actions">
          <a [routerLink]="['/f', slug]" class="btn btn-secondary">
            Enviar Outra Resposta
          </a>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .success-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--color-gray-50);
      padding: var(--spacing-4);
    }
    
    .success-container {
      text-align: center;
      background-color: var(--color-white);
      padding: var(--spacing-12);
      border-radius: var(--border-radius-lg);
      box-shadow: var(--shadow-md);
      max-width: 480px;
      width: 100%;
    }
    
    .success-icon {
      width: 100px;
      height: 100px;
      margin: 0 auto var(--spacing-6);
      background-color: #d4edda;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      
      svg {
        color: var(--color-success);
      }
    }
    
    h1 {
      margin-bottom: var(--spacing-2);
      color: var(--color-gray-900);
    }
    
    .success-actions {
      margin-top: var(--spacing-8);
    }
  `]
})
export class FormSuccessComponent implements OnInit {
    slug: string = '';

    constructor(private route: ActivatedRoute) { }

    ngOnInit() {
        this.slug = this.route.snapshot.paramMap.get('slug') || '';
    }
}
