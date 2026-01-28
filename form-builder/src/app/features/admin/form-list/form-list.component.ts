import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormService } from '../../../core/services/form.service';
import { Form } from '../../../core/models/form.model';

@Component({
  selector: 'app-form-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-header">
      <div>
        <h1>Meus Formulários</h1>
        <p class="text-muted">Gerencie seus formulários de coleta de dados</p>
      </div>
      
      <a routerLink="/admin/forms/new" class="btn btn-primary">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Novo Formulário
      </a>
    </div>

    <!-- Loading -->
    <div *ngIf="loading" class="loading-container">
      <div class="spinner spinner-lg"></div>
    </div>

    <!-- Empty State -->
    <div *ngIf="!loading && forms.length === 0" class="empty-state card">
      <div class="card-body">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="12" y1="18" x2="12" y2="12"></line>
          <line x1="9" y1="15" x2="15" y2="15"></line>
        </svg>
        <h3>Você ainda não tem formulários</h3>
        <p class="text-muted">Crie seu primeiro formulário para começar a coletar dados.</p>
        <a routerLink="/admin/forms/new" class="btn btn-primary mt-4">Criar Formulário</a>
      </div>
    </div>

    <!-- Form List -->
    <div *ngIf="!loading && forms.length > 0" class="card">
      <table class="table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Status</th>
            <th>Respostas</th>
            <th>Criado em</th>
            <th class="text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let form of forms">
            <td>
              <div class="form-title-cell">
                <span class="font-medium">{{ form.title }}</span>
                <a [href]="'/f/' + form.slug" target="_blank" class="external-link">
                  /{{ form.slug }}
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                </a>
              </div>
            </td>
            <td>
              <span class="badge" [ngClass]="{
                'badge-published': form.status === 'published',
                'badge-draft': form.status === 'draft',
                'badge-archived': form.status === 'archived'
              }">
                {{ form.status === 'published' ? 'Publicado' : (form.status === 'draft' ? 'Rascunho' : 'Arquivado') }}
              </span>
            </td>
            <td>
              <a [routerLink]="['/admin/forms', form.id, 'responses']" class="response-count">
                Ver Respostas
              </a>
            </td>
            <td>{{ form.created_at | date:'dd/MM/yyyy' }}</td>
            <td class="text-right actions-cell">
              <a [routerLink]="['/admin/forms', form.id]" class="btn btn-sm btn-secondary">
                Editar
              </a>
              <button class="btn btn-sm btn-link text-error" (click)="deleteForm(form)">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-6);
    }
    
    .loading-container {
      display: flex;
      justify-content: center;
      padding: var(--spacing-16);
    }
    
    .empty-state {
      text-align: center;
      
      .card-body {
        padding: var(--spacing-16);
      }
      
      svg {
        color: var(--color-gray-300);
        margin-bottom: var(--spacing-4);
      }
      
      h3 {
        margin-bottom: var(--spacing-2);
      }
    }
    
    .form-title-cell {
      display: flex;
      flex-direction: column;
      
      .font-medium {
        color: var(--color-gray-900);
      }
      
      .external-link {
        font-size: var(--font-size-xs);
        color: var(--color-gray-500);
        display: inline-flex;
        align-items: center;
        gap: 4px;
        margin-top: 2px;
        
        &:hover {
          color: var(--color-primary);
        }
      }
    }
    
    .response-count {
      color: var(--color-primary);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      
      &:hover {
        text-decoration: underline;
      }
    }
    
    .actions-cell {
      display: flex;
      justify-content: flex-end;
      gap: var(--spacing-2);
      align-items: center;
    }
  `]
})
export class FormListComponent implements OnInit {
  forms: Form[] = [];
  loading = true;

  constructor(private formService: FormService) { }

  async ngOnInit() {
    await this.loadForms();
  }

  async loadForms() {
    try {
      this.loading = true;
      this.forms = await this.formService.getForms();
    } catch (error) {
      console.error('Erro ao carregar formulários:', error);
    } finally {
      this.loading = false;
    }
  }

  async deleteForm(form: Form) {
    if (!confirm(`Tem certeza que deseja excluir o formulário "${form.title}"?`)) {
      return;
    }

    try {
      await this.formService.deleteForm(form.id);
      this.forms = this.forms.filter(f => f.id !== form.id);
    } catch (error) {
      console.error('Erro ao excluir formulário:', error);
      alert('Erro ao excluir formulário. Tente novamente.');
    }
  }
}
