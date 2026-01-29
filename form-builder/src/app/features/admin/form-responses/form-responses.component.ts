import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormService } from '../../../core/services/form.service';
import { Form, FormField, SubmissionWithValues } from '../../../core/models/form.model';
import { ValidationService } from '../../../core/services/validation.service';

@Component({
  selector: 'app-form-responses',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-header">
      <div>
        <a [routerLink]="['/admin/forms', formId]" class="back-link">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Voltar ao Formulário
        </a>
        <h1>Respostas: {{ form?.title }}</h1>
        <p class="text-muted">{{ submissions.length }} resposta(s) recebida(s)</p>
      </div>
      
      <div class="header-actions">
        <button class="btn btn-secondary" (click)="exportCSV()" [disabled]="submissions.length === 0">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Exportar CSV
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div *ngIf="loading" class="loading-container">
      <div class="spinner spinner-lg"></div>
    </div>

    <!-- Empty State -->
    <div *ngIf="!loading && submissions.length === 0" class="empty-state card">
      <div class="card-body">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
        </svg>
        <h3>Nenhuma resposta ainda</h3>
        <p class="text-muted">Quando alguém enviar o formulário, as respostas aparecerão aqui.</p>
        <a *ngIf="form?.status === 'published'" 
           [href]="'/f/' + form?.slug" 
           target="_blank" 
           class="btn btn-primary mt-4">
          Ver Formulário
        </a>
      </div>
    </div>

    <!-- Responses Table -->
    <div *ngIf="!loading && submissions.length > 0" class="card">
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Data</th>
              <th *ngFor="let field of fields">{{ field.label }}</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let submission of submissions">
              <td class="date-cell">
                {{ formatDateTime(submission.submitted_at) }}
              </td>
              <td *ngFor="let field of fields">
                {{ formatValue(submission.values[field.id], field.field_type) }}
              </td>
              <td>
                <button class="btn btn-link btn-sm text-error" (click)="deleteSubmission(submission)">
                  Excluir
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--spacing-6);
    }
    
    .back-link {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-2);
      font-size: var(--font-size-sm);
      color: var(--color-gray-500);
      margin-bottom: var(--spacing-2);
      
      &:hover {
        color: var(--color-primary);
        text-decoration: none;
      }
    }
    
    .header-actions {
      display: flex;
      gap: var(--spacing-3);
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
    
    .table-container {
      overflow-x: auto;
    }
    
    .date-cell {
      white-space: nowrap;
      color: var(--color-gray-500);
      font-size: var(--font-size-sm);
    }
  `]
})
export class FormResponsesComponent implements OnInit {
  formId: string = '';
  form: Form | null = null;
  fields: FormField[] = [];
  submissions: SubmissionWithValues[] = [];
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private formService: FormService,
    private validationService: ValidationService,
    private cdr: ChangeDetectorRef
  ) { }

  async ngOnInit() {
    this.formId = this.route.snapshot.paramMap.get('id') || '';

    if (this.formId) {
      await this.loadData();
    }
  }

  async loadData() {
    try {
      this.loading = true;
      this.cdr.detectChanges();

      // Carregar formulário e campos
      this.form = await this.formService.getFormById(this.formId);
      this.fields = await this.formService.getFormFields(this.formId);

      // Carregar submissões
      this.submissions = await this.formService.getFormSubmissions(this.formId);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  formatDateTime(date: string): string {
    return this.validationService.formatDateTime(date);
  }

  formatValue(value: string | undefined, fieldType: string): string {
    if (!value) return '-';

    switch (fieldType) {
      case 'cpf':
        return this.validationService.formatCPF(value);
      case 'cnpj':
        return this.validationService.formatCNPJ(value);
      case 'phone':
        return this.validationService.formatPhone(value);
      case 'currency':
        return this.validationService.formatCurrency(value);
      case 'date':
        return this.validationService.formatDate(value);
      default:
        return value;
    }
  }

  async deleteSubmission(submission: SubmissionWithValues) {
    if (!confirm('Excluir esta resposta? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      await this.formService.deleteSubmission(submission.id);
      this.submissions = this.submissions.filter(s => s.id !== submission.id);
    } catch (error) {
      console.error('Erro ao excluir resposta:', error);
      alert('Erro ao excluir resposta. Tente novamente.');
    }
  }

  exportCSV() {
    if (this.submissions.length === 0 || this.fields.length === 0) return;

    // Criar cabeçalho
    const extraHeaders = ['codigo', 'status', 'produto_id', 'produto_nome', 'cliente_nome'];
    const headers = [...extraHeaders, 'Data', ...this.fields.map(f => f.label)];

    // Criar linhas
    const rows = this.submissions.map(submission => {
      const date = this.formatDateTime(submission.submitted_at);

      // Valores dos metadados (Integração Cademí)
      const metadata = submission.metadata || {};

      // Fallback para cliente_nome em submissões antigas
      let clienteNome = metadata['cliente_nome'];
      if (!clienteNome) {
        const nomeField = this.fields.find(f => f.label.toLowerCase().includes('nome'));
        if (nomeField) {
          clienteNome = submission.values[nomeField.id] || '';
        }
      }

      const extraValues = [
        metadata['codigo'] || '',
        metadata['status'] || '',
        metadata['produto_id'] || '',
        metadata['produto_nome'] || '',
        clienteNome || ''
      ];

      // Valores dos campos dinâmicos
      const fieldValues = this.fields.map(field => {
        const value = submission.values[field.id] || '';
        return this.formatValue(value, field.field_type);
      });

      return [...extraValues, date, ...fieldValues];
    });

    // Converter para CSV (usando ponto e vírgula como separador comum para Excel)
    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.map(cell => {
        // Escapar aspas duplas e garantir string
        const cellStr = cell ? String(cell).replace(/"/g, '""') : '';
        return `"${cellStr}"`;
      }).join(';'))
    ].join('\n');

    // Criar e baixar arquivo
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${this.form?.slug || 'respostas'}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }
}
