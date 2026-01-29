import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormService } from '../../../core/services/form.service';
import { Form, FormField, FieldType, CreateFieldDTO } from '../../../core/models/form.model';

@Component({
  selector: 'app-form-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="page-header">
      <div>
        <a routerLink="/admin/forms" class="back-link">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Voltar
        </a>
        <h1>{{ isNew ? 'Novo Formulário' : 'Editar Formulário' }}</h1>
      </div>
      
      <div class="header-actions">
        <button *ngIf="!isNew && form?.status === 'draft'" 
                class="btn btn-success" 
                (click)="publishForm()"
                [disabled]="saving">
          Publicar
        </button>
        <button class="btn btn-primary" (click)="saveForm()" [disabled]="saving">
          {{ saving ? 'Salvando...' : 'Salvar' }}
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div *ngIf="loading" class="loading-container" style="flex-direction: column; align-items: center; gap: 20px;">
      <div class="spinner spinner-lg"></div>
      <p style="color: var(--color-gray-500);">Carregando formulário...</p>
      <button class="btn btn-secondary btn-sm" (click)="loading = false; router.navigate(['/admin/forms'])">
        Cancelar e Voltar
      </button>
    </div>

    <div *ngIf="!loading" class="editor-grid">
      <!-- Form Settings -->
      <div class="editor-sidebar">
        <div class="card">
          <div class="card-header">
            <h3>Configurações</h3>
          </div>
          <div class="card-body">
            <div class="form-group">
              <label class="form-label">
                Título <span class="required">*</span>
              </label>
              <input type="text" 
                     class="form-input" 
                     [(ngModel)]="formData.title"
                     placeholder="Ex: Formulário de Cadastro"
                     (blur)="generateSlug()">
            </div>
            
            <div class="form-group">
              <label class="form-label">Descrição</label>
              <textarea class="form-textarea" 
                        [(ngModel)]="formData.description"
                        placeholder="Descrição opcional do formulário"
                        rows="3"></textarea>
            </div>
            
            <div class="form-group">
              <label class="form-label">
                URL (slug) <span class="required">*</span>
              </label>
              <div class="input-with-prefix">
                <span class="input-prefix">/f/</span>
                <input type="text" 
                       class="form-input" 
                       [(ngModel)]="formData.slug"
                       placeholder="meu-formulario">
              </div>
              <p class="form-help">URL: {{ getFormUrl() }}</p>
            </div>
            
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-select" [(ngModel)]="formData.status">
                <option value="draft">Rascunho</option>
                <option value="published">Publicado</option>
                <option value="archived">Arquivado</option>
              </select>
            </div>

            <hr style="margin: var(--spacing-6) 0; border: none; border-top: 1px solid var(--color-gray-200);">
            
            <div class="cademi-settings">
              <h3>Integração Cademí</h3>
              <p class="form-help" style="margin-bottom: var(--spacing-4);">
                Ative para emitir certificados automaticamente após o preenchimento.
              </p>

              <div class="form-check" style="margin-bottom: var(--spacing-4);">
                <input type="checkbox" 
                       id="cademiEnabled" 
                       [(ngModel)]="formData.settings.cademiEnabled">
                <label for="cademiEnabled">Ativar Integração</label>
              </div>

              <div *ngIf="formData.settings.cademiEnabled">
                <div class="form-group">
                  <label class="form-label">Token Cademí</label>
                  <input type="password" 
                         class="form-input" 
                         [(ngModel)]="formData.settings.cademiToken"
                         placeholder="Seu Token de API">
                </div>

                <div class="form-group">
                  <label class="form-label">ID do Produto</label>
                  <input type="text" 
                         class="form-input" 
                         [(ngModel)]="formData.settings.cademiProductId"
                         placeholder="Ex: 123">
                </div>

                <div class="form-group">
                  <label class="form-label">Nome do Produto</label>
                  <input type="text" 
                         class="form-input" 
                         [(ngModel)]="formData.settings.cademiProductName"
                         placeholder="Ex: Curso de Crédito Rural">
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Fields Editor -->
      <div class="editor-main">
        <div class="card">
          <div class="card-header">
            <h3>Campos do Formulário</h3>
            <button class="btn btn-secondary btn-sm" (click)="showAddField = true">
              + Adicionar Campo
            </button>
          </div>
          <div class="card-body">
            <!-- Empty State -->
            <div *ngIf="fields.length === 0" class="fields-empty">
              <p class="text-muted">Nenhum campo adicionado. Clique em "Adicionar Campo" para começar.</p>
            </div>

            <!-- Fields List -->
            <div *ngIf="fields.length > 0" class="fields-list">
              <div *ngFor="let field of fields; let i = index" class="field-item">
                <div class="field-handle">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="5" r="1"></circle>
                    <circle cx="12" cy="12" r="1"></circle>
                    <circle cx="12" cy="19" r="1"></circle>
                    <circle cx="5" cy="5" r="1"></circle>
                    <circle cx="5" cy="12" r="1"></circle>
                    <circle cx="5" cy="19" r="1"></circle>
                  </svg>
                </div>
                
                <div class="field-info">
                  <div class="field-label">
                    {{ field.label }}
                    <span *ngIf="field.required" class="required">*</span>
                  </div>
                  <div class="field-type">
                    {{ getFieldTypeLabel(field.field_type) }}
                  </div>
                </div>
                
                <div class="field-actions">
                  <button class="btn btn-link btn-sm" (click)="editField(field)">
                    Editar
                  </button>
                  <button class="btn btn-link btn-sm text-error" (click)="deleteField(field)">
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Field Modal -->
    <div *ngIf="showAddField || editingField" class="modal-backdrop" (click)="closeFieldModal()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ editingField ? 'Editar Campo' : 'Adicionar Campo' }}</h3>
          <button class="modal-close" (click)="closeFieldModal()">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">
              Tipo de Campo <span class="required">*</span>
            </label>
            <select class="form-select" [(ngModel)]="fieldData.field_type">
              <option value="text">Texto</option>
              <option value="email">E-mail</option>
              <option value="phone">Telefone</option>
              <option value="cpf">CPF</option>
              <option value="cnpj">CNPJ</option>
              <option value="number">Número</option>
              <option value="currency">Valor (R$)</option>
              <option value="date">Data</option>
              <option value="textarea">Texto Longo</option>
              <option value="select">Seleção (Dropdown)</option>
              <option value="radio">Opções (Radio)</option>
              <option value="checkbox">Múltipla Escolha (Checkbox)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">
              Rótulo <span class="required">*</span>
            </label>
            <input type="text" 
                   class="form-input" 
                   [(ngModel)]="fieldData.label"
                   placeholder="Ex: Nome Completo">
          </div>

          <div class="form-group">
            <label class="form-label">Placeholder</label>
            <input type="text" 
                   class="form-input" 
                   [(ngModel)]="fieldData.placeholder"
                   placeholder="Ex: Digite seu nome">
          </div>

          <div class="form-group">
            <label class="form-label">Texto de Ajuda</label>
            <input type="text" 
                   class="form-input" 
                   [(ngModel)]="fieldData.help_text"
                   placeholder="Ex: Informe seu nome completo">
          </div>

          <!-- Options for select/radio/checkbox -->
          <div *ngIf="['select', 'radio', 'checkbox'].includes(fieldData.field_type)" class="form-group">
            <label class="form-label">Opções (uma por linha)</label>
            <textarea class="form-textarea" 
                      [(ngModel)]="optionsText"
                      placeholder="Opção 1&#10;Opção 2&#10;Opção 3"
                      rows="4"></textarea>
          </div>

          <div class="form-check">
            <input type="checkbox" 
                   id="fieldRequired" 
                   [(ngModel)]="fieldData.required">
            <label for="fieldRequired">Campo obrigatório</label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closeFieldModal()">Cancelar</button>
          <button class="btn btn-primary" (click)="saveField()">
            {{ editingField ? 'Salvar' : 'Adicionar' }}
          </button>
        </div>
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
    
    .editor-grid {
      display: grid;
      grid-template-columns: 360px 1fr;
      gap: var(--spacing-6);
      align-items: start;
    }
    
    .editor-sidebar {
      position: sticky;
      top: var(--spacing-8);
    }
    
    .input-with-prefix {
      display: flex;
      
      .input-prefix {
        display: flex;
        align-items: center;
        padding: 0 var(--spacing-3);
        background-color: var(--color-gray-100);
        border: 1px solid var(--color-gray-300);
        border-right: none;
        border-radius: var(--border-radius-md) 0 0 var(--border-radius-md);
        color: var(--color-gray-500);
        font-size: var(--font-size-sm);
      }
      
      .form-input {
        border-radius: 0 var(--border-radius-md) var(--border-radius-md) 0;
      }
    }
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      h3 {
        margin: 0;
        font-size: var(--font-size-lg);
      }
    }
    
    .fields-empty {
      text-align: center;
      padding: var(--spacing-8);
    }
    
    .fields-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-3);
    }
    
    .field-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-4);
      padding: var(--spacing-4);
      background-color: var(--color-gray-50);
      border: 1px solid var(--color-gray-200);
      border-radius: var(--border-radius-md);
      transition: all var(--transition-fast);
      
      &:hover {
        border-color: var(--color-gray-300);
        background-color: var(--color-white);
      }
    }
    
    .field-handle {
      color: var(--color-gray-400);
      cursor: grab;
      
      &:active {
        cursor: grabbing;
      }
    }
    
    .field-info {
      flex: 1;
    }
    
    .field-label {
      font-weight: var(--font-weight-medium);
      color: var(--color-gray-800);
    }
    
    .field-type {
      font-size: var(--font-size-sm);
      color: var(--color-gray-500);
    }
    
    .field-actions {
      display: flex;
      gap: var(--spacing-2);
    }
    
    // Modal
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: var(--z-modal-backdrop);
      animation: fadeIn 0.2s ease-out;
    }
    
    .modal {
      background-color: var(--color-white);
      border-radius: var(--border-radius-lg);
      box-shadow: var(--shadow-xl);
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      animation: slideIn 0.2s ease-out;
    }
    
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-4) var(--spacing-6);
      border-bottom: 1px solid var(--color-gray-200);
      
      h3 {
        margin: 0;
      }
    }
    
    .modal-close {
      background: none;
      border: none;
      font-size: 24px;
      color: var(--color-gray-400);
      cursor: pointer;
      padding: 0;
      line-height: 1;
      
      &:hover {
        color: var(--color-gray-600);
      }
    }
    
    .modal-body {
      padding: var(--spacing-6);
      overflow-y: auto;
    }
    
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: var(--spacing-3);
      padding: var(--spacing-4) var(--spacing-6);
      border-top: 1px solid var(--color-gray-200);
      background-color: var(--color-gray-50);
    }
    
    @media (max-width: 900px) {
      .editor-grid {
        grid-template-columns: 1fr;
      }
      
      .editor-sidebar {
        position: static;
      }
    }
  `]
})
export class FormEditorComponent implements OnInit {
  isNew = true;
  loading = true;
  saving = false;

  form: Form | null = null;
  fields: FormField[] = [];

  formData = {
    title: '',
    description: '',
    slug: '',
    status: 'draft' as 'draft' | 'published' | 'archived',
    settings: {
      cademiEnabled: false,
      cademiProductId: '',
      cademiProductName: '',
      cademiToken: ''
    }
  };

  showAddField = false;
  editingField: FormField | null = null;

  fieldData: CreateFieldDTO = {
    form_id: '',
    label: '',
    field_type: 'text' as FieldType,
    placeholder: '',
    help_text: '',
    required: false,
    options: []
  };

  optionsText = '';

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private formService: FormService,
    private cdr: ChangeDetectorRef
  ) { }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.isNew = false;
      await this.loadForm(id);
    } else {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async loadForm(id: string) {
    console.log('FormEditor: loadForm started', id);
    try {
      this.loading = true;
      this.cdr.detectChanges();

      console.log('FormEditor: calling getFormById');
      this.form = await this.formService.getFormById(id);
      console.log('FormEditor: form loaded', this.form);

      if (this.form) {
        this.formData = {
          title: this.form.title,
          description: this.form.description || '',
          slug: this.form.slug,
          status: this.form.status,
          settings: {
            cademiEnabled: this.form.settings?.cademiEnabled || false,
            cademiProductId: this.form.settings?.cademiProductId || '',
            cademiProductName: this.form.settings?.cademiProductName || '',
            cademiToken: this.form.settings?.cademiToken || ''
          }
        };

        console.log('FormEditor: calling getFormFields');
        this.fields = await this.formService.getFormFields(id);
        console.log('FormEditor: fields loaded', this.fields);
      }
    } catch (error) {
      console.error('Erro ao carregar formulário:', error);
      alert('Erro ao carregar formulário.');
      this.router.navigate(['/admin/forms']);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  generateSlug() {
    if (!this.formData.slug && this.formData.title) {
      this.formData.slug = this.formService.generateSlug(this.formData.title);
    }
  }

  getFormUrl(): string {
    return `${window.location.origin}/f/${this.formData.slug || 'meu-formulario'}`;
  }

  getFieldTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      text: 'Texto',
      email: 'E-mail',
      phone: 'Telefone',
      cpf: 'CPF',
      cnpj: 'CNPJ',
      number: 'Número',
      currency: 'Valor (R$)',
      date: 'Data',
      textarea: 'Texto Longo',
      select: 'Seleção',
      radio: 'Opções',
      checkbox: 'Múltipla Escolha',
      file: 'Arquivo'
    };
    return labels[type] || type;
  }

  async saveForm() {
    if (!this.formData.title || !this.formData.slug) {
      alert('Preencha o título e a URL do formulário.');
      return;
    }

    try {
      this.saving = true;

      if (this.isNew) {
        this.form = await this.formService.createForm(this.formData);
        this.isNew = false;
        this.router.navigate(['/admin/forms', this.form.id], { replaceUrl: true });
      } else if (this.form) {
        this.form = await this.formService.updateForm(this.form.id, this.formData);
      }
    } catch (error: any) {
      console.error('Erro ao salvar formulário:', error);
      if (error.message?.includes('duplicate')) {
        alert('Já existe um formulário com esta URL.');
      } else {
        alert('Erro ao salvar formulário. Tente novamente.');
      }
    } finally {
      this.saving = false;
    }
  }

  async publishForm() {
    if (this.form && confirm('Publicar este formulário? Ele ficará acessível publicamente.')) {
      try {
        this.saving = true;
        this.form = await this.formService.publishForm(this.form.id);
        this.formData.status = 'published';
      } catch (error) {
        console.error('Erro ao publicar:', error);
        alert('Erro ao publicar formulário.');
      } finally {
        this.saving = false;
      }
    }
  }

  // Field Management
  editField(field: FormField) {
    this.editingField = field;
    this.fieldData = {
      form_id: field.form_id,
      label: field.label,
      field_type: field.field_type,
      placeholder: field.placeholder || '',
      help_text: field.help_text || '',
      required: field.required,
      options: field.options || []
    };
    this.optionsText = (field.options || []).map(o => o.label).join('\n');
  }

  closeFieldModal() {
    this.showAddField = false;
    this.editingField = null;
    this.resetFieldData();
  }

  resetFieldData() {
    this.fieldData = {
      form_id: this.form?.id || '',
      label: '',
      field_type: 'text',
      placeholder: '',
      help_text: '',
      required: false,
      options: []
    };
    this.optionsText = '';
  }

  async saveField() {
    if (!this.fieldData.label) {
      alert('Informe o rótulo do campo.');
      return;
    }

    if (!this.form) {
      alert('Salve o formulário antes de adicionar campos.');
      return;
    }

    // Parse options
    if (['select', 'radio', 'checkbox'].includes(this.fieldData.field_type)) {
      this.fieldData.options = this.optionsText
        .split('\n')
        .filter(line => line.trim())
        .map(line => ({
          label: line.trim(),
          value: line.trim().toLowerCase().replace(/\s+/g, '_')
        }));
    }

    try {
      if (this.editingField) {
        const updated = await this.formService.updateField(this.editingField.id, this.fieldData);
        const index = this.fields.findIndex(f => f.id === this.editingField!.id);
        if (index !== -1) {
          this.fields[index] = updated;
        }
      } else {
        this.fieldData.form_id = this.form.id;
        const newField = await this.formService.createField(this.fieldData);
        this.fields.push(newField);
      }

      this.closeFieldModal();
    } catch (error) {
      console.error('Erro ao salvar campo:', error);
      alert('Erro ao salvar campo. Tente novamente.');
    }
  }

  async deleteField(field: FormField) {
    if (!confirm(`Excluir o campo "${field.label}"?`)) {
      return;
    }

    try {
      await this.formService.deleteField(field.id);
      this.fields = this.fields.filter(f => f.id !== field.id);
    } catch (error) {
      console.error('Erro ao excluir campo:', error);
      alert('Erro ao excluir campo. Tente novamente.');
    }
  }
}
