import { Component, OnInit, ChangeDetectorRef, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { FormService } from '../../../core/services/form.service';
import { Form, FormField, FieldType, CreateFieldDTO } from '../../../core/models/form.model';

@Component({
  selector: 'app-form-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DragDropModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
        <h1>{{ isNew() ? 'Novo Formulário' : 'Editar Formulário' }}</h1>
      </div>
      
      <div class="header-actions">
        <button *ngIf="!isNew() && form()?.status === 'draft'" 
                class="btn btn-success" 
                (click)="publishForm()"
                [disabled]="saving()">
          Publicar
        </button>
        <button class="btn btn-primary" (click)="saveForm()" [disabled]="saving()">
          {{ saving() ? 'Salvando...' : 'Salvar' }}
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div *ngIf="loading()" class="loading-container" style="flex-direction: column; align-items: center; gap: 20px;">
      <div class="spinner spinner-lg"></div>
      <p style="color: var(--color-gray-500);">Carregando formulário...</p>
      <button class="btn btn-secondary btn-sm" (click)="cancelLoading()">
        Cancelar e Voltar
      </button>
    </div>

    <div *ngIf="!loading()" class="editor-grid">
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
                     [ngModel]="formData().title"
                     (ngModelChange)="updateFormData('title', $event)"
                     placeholder="Ex: Formulário de Cadastro"
                     (blur)="generateSlug()">
            </div>
            
            <div class="form-group">
              <label class="form-label">Descrição</label>
              <textarea class="form-textarea" 
                        [ngModel]="formData().description"
                        (ngModelChange)="updateFormData('description', $event)"
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
                       [ngModel]="formData().slug"
                       (ngModelChange)="updateFormData('slug', $event)"
                       placeholder="meu-formulario">
              </div>
              <p class="form-help">URL: {{ getFormUrl() }}</p>
            </div>
            
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-select" 
                      [ngModel]="formData().status"
                      (ngModelChange)="updateFormData('status', $event)">
                <option value="draft">Rascunho</option>
                <option value="published">Publicado</option>
                <option value="archived">Arquivado</option>
              </select>
            </div>

            <div class="visual-settings">
              <h3>Personalização Visual</h3>
              
              <div class="form-group">
                <label class="form-label">URL da Imagem de Fundo</label>
                <input type="text" 
                       class="form-input" 
                       [ngModel]="formData().settings.backgroundImageUrl"
                       (ngModelChange)="updateSetting('backgroundImageUrl', $event)"
                       placeholder="https://exemplo.com/imagem.jpg">
                <p class="form-help">Use uma imagem de alta resolução.</p>
              </div>

              <div class="form-group">
                <label class="form-label">Opacidade do Fundo (0-100)</label>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <input type="range" 
                         min="0" max="100" 
                         style="flex: 1;"
                         [ngModel]="formData().settings.backgroundOpacity"
                         (ngModelChange)="updateSetting('backgroundOpacity', $event)">
                  <span style="min-width: 40px;">{{ formData().settings.backgroundOpacity }}%</span>
                </div>
              </div>
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
                       [ngModel]="formData().settings.cademiEnabled"
                       (ngModelChange)="updateSetting('cademiEnabled', $event)">
                <label for="cademiEnabled">Ativar Integração</label>
              </div>

              <div *ngIf="formData().settings.cademiEnabled">
                <div class="form-group">
                  <label class="form-label">Token Cademí</label>
                  <input type="password" 
                         class="form-input" 
                         [ngModel]="formData().settings.cademiToken"
                         (ngModelChange)="updateSetting('cademiToken', $event)"
                         placeholder="Seu Token de API">
                </div>

                <div class="form-group">
                  <label class="form-label">ID do Produto (Cademí)</label>
                  <input type="text" 
                         class="form-input" 
                         [ngModel]="formData().settings.cademiProductId"
                         (ngModelChange)="updateSetting('cademiProductId', $event)"
                         placeholder="Ex: 171440">
                </div>

                <div class="form-group">
                  <label class="form-label">Ação ao Enviar</label>
                  <select class="form-select" 
                          [ngModel]="formData().settings.cademiStatus"
                          (ngModelChange)="updateSetting('cademiStatus', $event)">
                    <option value="aprovado">Liberar Acesso ao Curso</option>
                    <option value="concluido">Emitir Certificado Diretamente</option>
                  </select>
                  <p class="form-help">"Emitir Certificado" marca o produto como concluído na Cademí.</p>
                </div>

                <div class="form-group">
                  <label class="form-label">Nome do Produto</label>
                  <input type="text" 
                         class="form-input" 
                         [ngModel]="formData().settings.cademiProductName"
                         (ngModelChange)="updateSetting('cademiProductName', $event)"
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
            <button class="btn btn-secondary btn-sm" (click)="showAddFieldModal()">
              + Adicionar Campo
            </button>
          </div>
          <div class="card-body">
            <!-- Empty State -->
            <div *ngIf="fields().length === 0" class="fields-empty">
              <p class="text-muted">Nenhum campo adicionado. Clique em "Adicionar Campo" para começar.</p>
            </div>

            <!-- Fields List -->
            <div *ngIf="fields().length > 0" 
                 class="fields-list" 
                 cdkDropList 
                 (cdkDropListDropped)="drop($event)">
              <div *ngFor="let field of fields(); let i = index" 
                   class="field-item" 
                   cdkDrag
                   [cdkDragData]="field">
                
                <!-- Placeholder for drag -->
                <div class="field-item-placeholder" *cdkDragPlaceholder></div>

                <div class="field-handle" cdkDragHandle>
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
    <div *ngIf="showAddField() || editingField()" class="modal-backdrop" (click)="closeFieldModal()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ editingField() ? 'Editar Campo' : 'Adicionar Campo' }}</h3>
          <button class="modal-close" (click)="closeFieldModal()">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">
              Tipo de Campo <span class="required">*</span>
            </label>
            <select class="form-select" 
                    [ngModel]="fieldData().field_type"
                    (ngModelChange)="updateFieldData('field_type', $event)">
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
              <option value="nps">NPS (0-10)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">
              Rótulo <span class="required">*</span>
            </label>
            <input type="text" 
                   class="form-input" 
                   [ngModel]="fieldData().label"
                   (ngModelChange)="updateFieldData('label', $event)"
                   placeholder="Ex: Nome Completo">
          </div>

          <div class="form-group">
            <label class="form-label">Placeholder</label>
            <input type="text" 
                   class="form-input" 
                   [ngModel]="fieldData().placeholder"
                   (ngModelChange)="updateFieldData('placeholder', $event)"
                   placeholder="Ex: Digite seu nome">
          </div>

          <div class="form-group">
            <label class="form-label">Texto de Ajuda</label>
            <input type="text" 
                   class="form-input" 
                   [ngModel]="fieldData().help_text"
                   (ngModelChange)="updateFieldData('help_text', $event)"
                   placeholder="Ex: Informe seu nome completo">
          </div>

          <!-- Options for select/radio/checkbox -->
          <div *ngIf="['select', 'radio', 'checkbox'].includes(fieldData().field_type)" class="form-group">
            <label class="form-label">Opções (uma por linha)</label>
            <textarea class="form-textarea" 
                      [ngModel]="optionsText()"
                      (ngModelChange)="optionsText.set($event)"
                      placeholder="Opção 1&#10;Opção 2&#10;Opção 3"
                      rows="4"></textarea>
          </div>
          <div class="form-group">
            <div class="form-check">
              <input type="checkbox" 
                     id="fieldRequired" 
                     [ngModel]="fieldData().required"
                     (ngModelChange)="updateFieldData('required', $event)">
              <label for="fieldRequired">Campo obrigatório</label>
            </div>
          </div>

          <hr class="my-4">

          <div class="form-group mb-0">
            <div class="form-check">
              <input type="checkbox" 
                     id="enableLogic" 
                     [ngModel]="logicEnabled()"
                     (ngModelChange)="toggleLogic($event)">
              <label for="enableLogic"><strong>Lógica Condicional</strong></label>
            </div>
            <p class="text-sm text-gray-500 ml-6">Mostrar ou ocultar este campo baseado em outras respostas.</p>
          </div>

          <div *ngIf="logicEnabled() && fieldData().logic" class="logic-container mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div class="flex items-center gap-2 mb-4">
              <select class="form-input text-sm w-32"
                      [ngModel]="fieldData().logic?.action"
                      (ngModelChange)="updateFieldData('logic', { action: $event, operator: fieldData().logic?.operator, rules: fieldData().logic?.rules })">
                <option value="show">Mostrar</option>
                <option value="hide">Ocultar</option>
              </select>
              <span>se</span>
              <select class="form-input text-sm w-32"
                      [ngModel]="fieldData().logic?.operator"
                      (ngModelChange)="updateFieldData('logic', { action: fieldData().logic?.action, operator: $event, rules: fieldData().logic?.rules })">
                <option value="all">todas as</option>
                <option value="any">qualquer uma das</option>
              </select>
              <span>regras forem atendidas:</span>
            </div>

            <div class="logic-rules space-y-3">
              <div *ngFor="let rule of fieldData().logic?.rules; let i = index" class="logic-rule flex items-start gap-2">
                <div class="flex-1 space-y-2">
                  <select class="form-input text-sm" 
                          [ngModel]="rule.field_id"
                          (ngModelChange)="updateLogicRule(i, 'field_id', $event)">
                    <option value="">Selecione um campo...</option>
                    <option *ngFor="let f of fields()" [value]="f.id" [disabled]="f.id === editingField()?.id">
                      {{ f.label }}
                    </option>
                  </select>

                  <div class="flex gap-2">
                    <select class="form-input text-sm w-40" 
                            [ngModel]="rule.operator"
                            (ngModelChange)="updateLogicRule(i, 'operator', $event)">
                      <option value="equals">é igual a</option>
                      <option value="not_equals">é diferente de</option>
                      <option value="contains">contém</option>
                      <option value="not_contains">não contém</option>
                    </select>
                    <input type="text" class="form-input text-sm" 
                           [ngModel]="rule.value"
                           (ngModelChange)="updateLogicRule(i, 'value', $event)"
                           placeholder="Valor">
                  </div>
                </div>
                <button class="btn btn-icon text-red-500 mt-1" title="Remover regra" (click)="removeLogicRule(i)">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>

            <button class="btn btn-outline-primary btn-sm mt-4 w-full" (click)="addLogicRule()">
              <i class="bi bi-plus-lg mr-2"></i> Adicionar Regra
            </button>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closeFieldModal()">Cancelar</button>
          <button class="btn btn-primary" (click)="saveField()">
            {{ editingField() ? 'Salvar' : 'Adicionar' }}
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
      position: relative;
      
      &:hover {
        border-color: var(--color-gray-300);
        background-color: var(--color-white);
      }
    }

    /* Drag and Drop Styles */
    .cdk-drag-preview {
      box-sizing: border-box;
      border-radius: var(--border-radius-md);
      box-shadow: var(--shadow-xl);
      background-color: var(--color-white);
      display: flex;
      align-items: center;
      gap: var(--spacing-4);
      padding: var(--spacing-4);
      border: 1px solid var(--color-primary);
      z-index: 1000;
    }

    .cdk-drag-placeholder {
      opacity: 0;
    }

    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .fields-list.cdk-drop-list-dragging .field-item:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .field-item-placeholder {
      background: var(--color-gray-100);
      border: 2px dashed var(--color-gray-300);
      border-radius: var(--border-radius-md);
      min-height: 60px;
    }
    
    .field-handle {
      color: var(--color-gray-400);
      cursor: grab;
      display: flex;
      align-items: center;
      
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
  private route = inject(ActivatedRoute);
  public router = inject(Router);
  private formService = inject(FormService);
  private cdr = inject(ChangeDetectorRef);

  isNew = signal(true);
  loading = signal(true);
  saving = signal(false);

  form = signal<Form | null>(null);
  fields = signal<FormField[]>([]);

  formData = signal({
    title: '',
    description: '',
    slug: '',
    status: 'draft' as 'draft' | 'published' | 'archived',
    settings: {
      cademiEnabled: false,
      cademiProductId: '',
      cademiProductName: '',
      cademiToken: '',
      cademiStatus: 'aprovado' as 'aprovado' | 'concluido',
      backgroundImageUrl: '',
      backgroundOpacity: 100
    }
  });

  showAddField = signal(false);
  editingField = signal<FormField | null>(null);
  logicEnabled = signal(false);

  fieldData = signal<CreateFieldDTO>({
    form_id: '',
    label: '',
    field_type: 'text' as FieldType,
    placeholder: '',
    help_text: '',
    required: false,
    options: [],
    logic: undefined
  });

  optionsText = signal('');

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.isNew.set(false);
      await this.loadForm(id);
    } else {
      this.loading.set(false);
    }
  }

  async loadForm(id: string) {
    try {
      this.loading.set(true);

      const formResult = await this.formService.getFormById(id);
      this.form.set(formResult);

      if (formResult) {
        this.formData.set({
          title: formResult.title,
          description: formResult.description || '',
          slug: formResult.slug,
          status: formResult.status,
          settings: {
            cademiEnabled: formResult.settings?.cademiEnabled || false,
            cademiProductId: formResult.settings?.cademiProductId || '',
            cademiProductName: formResult.settings?.cademiProductName || '',
            cademiToken: formResult.settings?.cademiToken || '',
            cademiStatus: formResult.settings?.cademiStatus || 'aprovado',
            backgroundImageUrl: formResult.settings?.backgroundImageUrl || '',
            backgroundOpacity: formResult.settings?.backgroundOpacity !== undefined ? formResult.settings.backgroundOpacity : 100
          }
        });

        const fieldsResult = await this.formService.getFormFields(id);
        this.fields.set(fieldsResult);
      }
    } catch (error) {
      console.error('Erro ao carregar formulário:', error);
      alert('Erro ao carregar formulário.');
      this.router.navigate(['/admin/forms']);
    } finally {
      this.loading.set(false);
    }
  }

  cancelLoading() {
    this.loading.set(false);
    this.router.navigate(['/admin/forms']);
  }

  updateFormData(key: string, value: any) {
    this.formData.update(data => ({ ...data, [key]: value }));
  }

  updateSetting(key: string, value: any) {
    this.formData.update(data => ({
      ...data,
      settings: { ...data.settings, [key]: value }
    }));
  }

  updateFieldData(key: string, value: any) {
    this.fieldData.update(data => ({ ...data, [key]: value }));
  }

  generateSlug() {
    const currentData = this.formData();
    if (!currentData.slug && currentData.title) {
      this.updateFormData('slug', this.formService.generateSlug(currentData.title));
    }
  }

  getFormUrl(): string {
    return `${window.location.origin}/f/${this.formData().slug || 'meu-formulario'}`;
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
      file: 'Arquivo',
      nps: 'NPS (0-10)'
    };
    return labels[type] || type;
  }

  async saveForm() {
    const currentData = this.formData();
    if (!currentData.title || !currentData.slug) {
      alert('Preencha o título e a URL do formulário.');
      return;
    }

    try {
      this.saving.set(true);

      if (this.isNew()) {
        const newForm = await this.formService.createForm(currentData);
        this.form.set(newForm);
        this.isNew.set(false);
        this.router.navigate(['/admin/forms', newForm.id], { replaceUrl: true });
      } else {
        const currentForm = this.form();
        if (currentForm) {
          const updated = await this.formService.updateForm(currentForm.id, currentData);
          this.form.set(updated);
        }
      }
    } catch (error: any) {
      console.error('Erro ao salvar formulário:', error);
      if (error.message?.includes('duplicate')) {
        alert('Já existe um formulário com esta URL.');
      } else {
        alert('Erro ao salvar formulário. Tente novamente.');
      }
    } finally {
      this.saving.set(false);
    }
  }

  async publishForm() {
    const currentForm = this.form();
    if (currentForm && confirm('Publicar este formulário? Ele ficará acessível publicamente.')) {
      try {
        this.saving.set(true);
        const published = await this.formService.publishForm(currentForm.id);
        this.form.set(published);
        this.updateFormData('status', 'published');
      } catch (error) {
        console.error('Erro ao publicar:', error);
        alert('Erro ao publicar formulário.');
      } finally {
        this.saving.set(false);
      }
    }
  }

  showAddFieldModal() {
    this.resetFieldData();
    this.showAddField.set(true);
  }

  editField(field: FormField) {
    this.editingField.set(field);
    this.fieldData.set({
      form_id: field.form_id,
      label: field.label,
      field_type: field.field_type,
      placeholder: field.placeholder || '',
      help_text: field.help_text || '',
      required: field.required,
      options: field.options || [],
      logic: field.logic
    });
    this.logicEnabled.set(!!field.logic);
    this.optionsText.set((field.options || []).map(o => o.label).join('\n'));
  }

  closeFieldModal() {
    this.showAddField.set(false);
    this.editingField.set(null);
    this.resetFieldData();
  }

  resetFieldData() {
    this.fieldData.set({
      form_id: this.form()?.id || '',
      label: '',
      field_type: 'text' as FieldType,
      placeholder: '',
      help_text: '',
      required: false,
      options: [],
      logic: undefined
    });
    this.logicEnabled.set(false);
    this.optionsText.set('');
  }

  toggleLogic(enabled: boolean) {
    this.logicEnabled.set(enabled);
    if (enabled && !this.fieldData().logic) {
      this.fieldData.update(prev => ({
        ...prev,
        logic: {
          action: 'show',
          operator: 'all',
          rules: []
        }
      }));
      this.addLogicRule();
    } else if (!enabled) {
      this.fieldData.update(prev => ({ ...prev, logic: undefined }));
    }
  }

  addLogicRule() {
    this.fieldData.update(prev => {
      const logic = prev.logic || { action: 'show', operator: 'all', rules: [] };
      return {
        ...prev,
        logic: {
          ...logic,
          rules: [...logic.rules, { field_id: '', operator: 'equals', value: '' }]
        }
      };
    });
  }

  removeLogicRule(index: number) {
    this.fieldData.update(prev => {
      if (!prev.logic) return prev;
      const rules = [...prev.logic.rules];
      rules.splice(index, 1);
      return {
        ...prev,
        logic: { ...prev.logic, rules }
      };
    });
  }

  updateLogicRule(index: number, key: string, value: any) {
    this.fieldData.update(prev => {
      if (!prev.logic) return prev;
      const rules = [...prev.logic.rules];
      rules[index] = { ...rules[index], [key]: value };
      return {
        ...prev,
        logic: { ...prev.logic, rules }
      };
    });
  }

  async saveField() {
    const currentFieldData = this.fieldData();
    if (!currentFieldData.label) {
      alert('Informe o rótulo do campo.');
      return;
    }

    const currentForm = this.form();
    if (!currentForm) {
      alert('Salve o formulário antes de adicionar campos.');
      return;
    }

    // Parse options
    if (['select', 'radio', 'checkbox'].includes(currentFieldData.field_type)) {
      currentFieldData.options = this.optionsText()
        .split('\n')
        .filter(line => line.trim())
        .map(line => ({
          label: line.trim(),
          value: line.trim().toLowerCase().replace(/\s+/g, '_')
        }));
    }

    try {
      const currentEditingField = this.editingField();
      if (currentEditingField) {
        const updated = await this.formService.updateField(currentEditingField.id, currentFieldData);
        this.fields.update(prev => {
          const index = prev.findIndex(f => f.id === currentEditingField.id);
          if (index !== -1) {
            const next = [...prev];
            next[index] = updated;
            return next;
          }
          return prev;
        });
      } else {
        currentFieldData.form_id = currentForm.id;
        const newField = await this.formService.createField(currentFieldData);
        this.fields.update(prev => [...prev, newField]);
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
      this.fields.update(prev => prev.filter(f => f.id !== field.id));
    } catch (error) {
      console.error('Erro ao excluir campo:', error);
      alert('Erro ao excluir campo. Tente novamente.');
    }
  }

  async drop(event: CdkDragDrop<FormField[]>) {
    if (event.previousIndex === event.currentIndex) return;

    const currentFields = [...this.fields()];
    moveItemInArray(currentFields, event.previousIndex, event.currentIndex);
    this.fields.set(currentFields);

    try {
      const fieldIds = currentFields.map(f => f.id);
      const currentForm = this.form();
      if (currentForm) {
        await this.formService.reorderFields(currentForm.id, fieldIds);
      }
    } catch (error) {
      console.error('Erro ao reordenar campos:', error);
      // Reverter em caso de erro (recarga simples para este MVP)
      const currentForm = this.form();
      if (currentForm) {
        const fieldsResult = await this.formService.getFormFields(currentForm.id);
        this.fields.set(fieldsResult);
      }
    }
  }
}
