import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormService } from '../../../core/services/form.service';
import { FORM_TEMPLATES, FormTemplate } from '../../../core/constants/form-templates';

@Component({
    selector: 'app-form-template-gallery',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="gallery-container">
      <header class="gallery-header">
        <div class="header-content">
          <h1>Criar Novo Formulário</h1>
          <p>Escolha um modelo pronto ou comece do zero para criar sua pesquisa.</p>
        </div>
        <a routerLink="/admin/forms" class="btn btn-secondary btn-sm">
          <i class="bi bi-arrow-left mr-1"></i> Voltar
        </a>
      </header>

      <div class="templates-grid">
        <!-- Começar do Zero -->
        <div class="template-card blank-card" (click)="createBlank()">
          <div class="card-icon">
            <i class="bi bi-plus-lg"></i>
          </div>
          <div class="card-body">
            <h3>Começar do Zero</h3>
            <p>Crie um formulário vazio e adicione os campos que desejar.</p>
          </div>
          <div class="card-footer">
            <span class="btn-text">Criar Vazio <i class="bi bi-chevron-right ml-1"></i></span>
          </div>
        </div>

        <!-- Templates -->
        <div *ngFor="let template of templates()" 
             class="template-card" 
             [class.loading]="creating() === template.id"
             (click)="createFromTemplate(template)">
          <div class="card-icon" [style.background-color]="template.form.settings?.primaryColor + '15'" [style.color]="template.form.settings?.primaryColor">
            <i [class]="'bi ' + template.icon"></i>
          </div>
          <div class="card-body">
            <h3>{{ template.name }}</h3>
            <p>{{ template.description }}</p>
          </div>
          <div class="card-footer">
            <span class="btn-text">Usar Modelo <i class="bi bi-chevron-right ml-1"></i></span>
          </div>
          
          <div *ngIf="creating() === template.id" class="card-overlay">
            <div class="spinner spinner-white"></div>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .gallery-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: var(--spacing-4);
    }

    .gallery-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--spacing-10);
      
      h1 {
        margin-bottom: var(--spacing-1);
        font-size: 2rem;
      }
      
      p {
        color: var(--color-gray-500);
        font-size: 1.1rem;
      }
    }

    .templates-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: var(--spacing-6);
    }

    .template-card {
      background: var(--color-white);
      border-radius: var(--border-radius-xl);
      border: 1px solid var(--color-gray-200);
      padding: var(--spacing-6);
      cursor: pointer;
      display: flex;
      flex-direction: column;
      height: 100%;
      position: relative;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);

      &:hover {
        transform: translateY(-8px);
        border-color: var(--color-primary);
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        
        .card-footer .btn-text {
          color: var(--color-primary);
          padding-left: 4px;
        }
      }

      &.blank-card {
        background: linear-gradient(135deg, var(--color-white) 0%, var(--color-gray-50) 100%);
        border: 2px dashed var(--color-gray-300);
        box-shadow: none;
        
        .card-icon {
          background-color: var(--color-gray-100);
          color: var(--color-gray-600);
        }
        
        &:hover {
          border-color: var(--color-primary);
          background: var(--color-white);
          border-style: solid;
        }
      }

      .card-icon {
        width: 56px;
        height: 56px;
        border-radius: var(--border-radius-lg);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        margin-bottom: var(--spacing-4);
        transition: transform 0.3s ease;
      }

      &:hover .card-icon {
        transform: scale(1.1) rotate(-5deg);
      }

      .card-body {
        flex: 1;
        
        h3 {
          font-size: 1.25rem;
          font-weight: var(--font-weight-bold);
          margin-bottom: var(--spacing-2);
          color: var(--color-gray-900);
        }
        
        p {
          font-size: var(--font-size-sm);
          color: var(--color-gray-500);
          line-height: 1.5;
        }
      }

      .card-footer {
        margin-top: var(--spacing-6);
        padding-top: var(--spacing-4);
        border-top: 1px solid var(--color-gray-100);
        
        .btn-text {
          font-weight: var(--font-weight-semibold);
          font-size: var(--font-size-sm);
          color: var(--color-gray-600);
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
        }
      }

      .card-overlay {
        position: absolute;
        inset: 0;
        background: rgba(255, 255, 255, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
        backdrop-filter: blur(2px);
      }
    }

    .spinner-white {
      border-color: var(--color-primary) transparent transparent transparent;
    }

    @media (max-width: 640px) {
      .gallery-header {
        flex-direction: column;
        gap: var(--spacing-4);
      }
    }
  `]
})
export class FormTemplateGalleryComponent {
    private router = inject(Router);
    private formService = inject(FormService);

    templates = signal<FormTemplate[]>(FORM_TEMPLATES);
    creating = signal<string | null>(null);

    createBlank() {
        this.router.navigate(['/admin/forms/new/editor']);
    }

    async createFromTemplate(template: FormTemplate) {
        if (this.creating()) return;

        try {
            this.creating.set(template.id);
            const form = await this.formService.createFromTemplate(template);
            this.router.navigate(['/admin/forms', form.id]);
        } catch (error) {
            console.error('Erro ao criar formulário:', error);
            alert('Erro ao criar formulário a partir do modelo.');
        } finally {
            this.creating.set(null);
        }
    }
}
