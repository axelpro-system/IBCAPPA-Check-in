import { Component, OnInit, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FormService } from '../../../core/services/form.service';
import { Form } from '../../../core/models/form.model';

@Component({
  selector: 'app-form-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
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

    <!-- Tag Filter -->
    <div class="tag-filters" *ngIf="allTags.length > 0">
      <button class="tag-filter-btn" [class.active]="!selectedTag()" (click)="filterByTag(null)">
        Todos
      </button>
      <button *ngFor="let tag of allTags" 
              class="tag-filter-btn" 
              [class.active]="selectedTag() === tag"
              (click)="filterByTag(tag)">
        {{ tag }}
      </button>
    </div>

    <div class="stats-grid" *ngIf="!loading">
      <div class="stat-card card">
        <div class="card-body">
          <p class="stat-label">Formularios</p>
          <h3>{{ stats.totalForms }}</h3>
        </div>
      </div>
      <div class="stat-card card">
        <div class="card-body">
          <p class="stat-label">Publicados</p>
          <h3>{{ stats.publishedForms }}</h3>
        </div>
      </div>
      <div class="stat-card card">
        <div class="card-body">
          <p class="stat-label">Rascunhos</p>
          <h3>{{ stats.draftForms }}</h3>
        </div>
      </div>
      <div class="stat-card card">
        <div class="card-body">
          <p class="stat-label">Respostas Totais</p>
          <h3>{{ stats.totalSubmissions }}</h3>
        </div>
      </div>
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
    <div *ngIf="!loading && filteredForms.length > 0" class="card">
      <table class="table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Tags</th>
            <th>Status</th>
            <th>Respostas</th>
            <th>Criado em</th>
            <th class="text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let form of filteredForms">
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
              <div class="tags-cell" *ngIf="form.tags?.length">
                <span *ngFor="let tag of form.tags" class="tag-pill">{{ tag }}</span>
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

    .tag-filters {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-2);
      margin-bottom: var(--spacing-6);
    }

    .tag-filter-btn {
      padding: 6px 12px;
      border: 1px solid var(--color-gray-200);
      border-radius: var(--border-radius-md);
      background: var(--color-white);
      color: var(--color-gray-600);
      font-size: var(--font-size-sm);
      cursor: pointer;
      transition: all var(--transition-fast);

      &:hover {
        border-color: var(--color-primary);
        color: var(--color-primary);
      }

      &.active {
        background: var(--color-primary);
        color: white;
        border-color: var(--color-primary);
      }
    }
    
    .loading-container {
      display: flex;
      justify-content: center;
      padding: var(--spacing-16);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: var(--spacing-4);
      margin-bottom: var(--spacing-6);
    }

    .stat-card h3 {
      margin: 0;
      font-size: 1.75rem;
      color: var(--color-gray-900);
    }

    .stat-label {
      margin: 0 0 var(--spacing-2);
      color: var(--color-gray-500);
      font-size: var(--font-size-sm);
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

    .tags-cell {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    .tag-pill {
      display: inline-block;
      padding: 2px 8px;
      background-color: var(--color-gray-100);
      color: var(--color-gray-600);
      border-radius: 12px;
      font-size: var(--font-size-xs);
    }
    
    .actions-cell {
      display: flex;
      justify-content: flex-end;
      gap: var(--spacing-2);
      align-items: center;
    }

    @media (max-width: 980px) {
      .stats-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  `]
})
export class FormListComponent implements OnInit {
  forms: Form[] = [];
  loading = true;
  selectedTag = signal<string | null>(null);
  allTags: string[] = [];
  stats = {
    totalForms: 0,
    publishedForms: 0,
    draftForms: 0,
    totalSubmissions: 0
  };

  constructor(
    private formService: FormService,
    private cdr: ChangeDetectorRef
  ) { }

  async ngOnInit() {
    await this.loadForms();
  }

get filteredForms(): Form[] {
    const tag = this.selectedTag();
    if (!tag) return this.forms;
    return this.forms.filter(f => (f.tags || []).includes(tag));
  }

  filterByTag(tag: string | null) {
    this.selectedTag.set(tag);
  }

  async loadForms() {
    console.log('[FormList] Iniciando carregamento de formulários...');
    try {
      this.loading = true;
      this.cdr.detectChanges();

      const startTime = Date.now();

      this.forms = await this.formService.getForms();

      // Extract all unique tags
      const tagSet = new Set<string>();
      this.forms.forEach(f => {
        (f.tags || []).forEach(tag => tagSet.add(tag));
      });
      this.allTags = Array.from(tagSet).sort();

      this.stats.totalForms = this.forms.length;
      this.stats.publishedForms = this.forms.filter(f => f.status === 'published').length;
      this.stats.draftForms = this.forms.filter(f => f.status === 'draft').length;

      const submissionCounts = await Promise.all(
        this.forms.map(form => this.formService.getSubmissionCount(form.id).catch(() => 0))
      );
      this.stats.totalSubmissions = submissionCounts.reduce((sum, count) => sum + count, 0);

      const elapsed = Date.now() - startTime;
      console.log(`[FormList] Carregamento concluído em ${elapsed}ms`);
      console.log(`[FormList] Total de formulários: ${this.forms.length}`);

      if (this.forms.length === 0) {
        console.log('[FormList] Nenhum formulário encontrado - verifique se o usuário está autenticado e tem permissão RLS');
      } else {
        console.log('[FormList] Formulários:', this.forms.map(f => ({ id: f.id, title: f.title, status: f.status })));
      }
    } catch (error: any) {
      console.error('[FormList] Erro ao carregar formulários:', error);
      console.error('[FormList] Detalhes do erro:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint
      });

      // Mostrar mensagem de erro ao usuário se for problema de autenticação
      if (error?.message?.includes('JWT') || error?.message?.includes('auth') || error?.code === 'PGRST301') {
        alert('Sua sessão expirou. Por favor, faça login novamente.');
      }
    } finally {
      this.loading = false;
      console.log('[FormList] Estado de loading:', this.loading);
      // Forçar atualização da view
      this.cdr.detectChanges();
      console.log('[FormList] Change detection forçado');
    }
  }


  async deleteForm(form: Form) {
    if (!confirm(`Tem certeza que deseja excluir o formulário "${form.title}"?`)) {
      return;
    }

    try {
      await this.formService.deleteForm(form.id);
      this.forms = this.forms.filter(f => f.id !== form.id);
      this.stats.totalForms = this.forms.length;
      this.stats.publishedForms = this.forms.filter(f => f.status === 'published').length;
      this.stats.draftForms = this.forms.filter(f => f.status === 'draft').length;
      await this.loadForms();
    } catch (error) {
      console.error('Erro ao excluir formulário:', error);
      alert('Erro ao excluir formulário. Tente novamente.');
    }
  }
}
