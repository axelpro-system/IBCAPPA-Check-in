import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FormService } from '../../../core/services/form.service';
import { Form } from '../../../core/models/form.model';
import { FormTemplateService, SavedFormTemplate } from '../../../core/services/form-template.service';

@Component({
    selector: 'app-form-template-manager',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    template: `
    <div class="page-header">
      <div>
        <h1>Modelos de Formulario</h1>
        <p class="text-muted">Crie e salve modelos para reaproveitar seus formularios.</p>
      </div>
      <a routerLink="/admin/forms/new" class="btn btn-secondary">Usar Galeria</a>
    </div>

    <div class="manager-grid">
      <div class="card">
        <div class="card-header">
          <h3>Novo Modelo</h3>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label class="form-label">Nome do Modelo</label>
            <input
              type="text"
              class="form-input"
              [ngModel]="templateData().name"
              (ngModelChange)="updateTemplateData('name', $event)"
              placeholder="Ex: Inscricao para Eventos">
          </div>

          <div class="form-group">
            <label class="form-label">Descricao</label>
            <textarea
              rows="3"
              class="form-textarea"
              [ngModel]="templateData().description"
              (ngModelChange)="updateTemplateData('description', $event)"
              placeholder="Explique quando esse modelo deve ser usado"></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Formulario Base</label>
            <select
              class="form-select"
              [ngModel]="templateData().sourceFormId"
              (ngModelChange)="updateTemplateData('sourceFormId', $event)">
              <option value="">Selecione...</option>
              <option *ngFor="let form of forms()" [value]="form.id">
                {{ form.title }}
              </option>
            </select>
            <p class="form-help">O modelo vai copiar configuracoes e campos do formulario selecionado.</p>
          </div>

          <div class="form-group">
            <label class="form-label">Tags / Categorias</label>
            <div class="tags-input-container">
              <div class="selected-tags">
                <span *ngFor="let tag of templateData().tags; let i = index" class="tag-badge">
                  {{ tag }}
                  <button type="button" class="tag-remove" (click)="removeTag(i)">×</button>
                </span>
              </div>
              <div class="tag-input-row">
                <input
                  type="text"
                  class="form-input"
                  [(ngModel)]="newTag"
                  (keydown.enter)="addTag()"
                  placeholder="Adicionar tag e pressionar Enter">
                <button type="button" class="btn btn-secondary btn-sm" (click)="addTag()">+</button>
              </div>
            </div>
            <p class="form-help">Ex: Sabatina, Evolute, NPS</p>
          </div>

          <button
            class="btn btn-primary"
            [disabled]="saving() || loadingForms()"
            (click)="saveTemplate()">
            {{ saving() ? 'Salvando...' : 'Salvar Modelo' }}
          </button>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3>Modelos Salvos</h3>
          <span class="badge badge-draft">{{ templates().length }}</span>
        </div>
        <div class="card-body">
          <div *ngIf="templates().length === 0" class="empty-state">
            <p class="text-muted">Nenhum modelo salvo ainda.</p>
          </div>

          <div *ngFor="let template of templates()" class="template-item">
            <div class="template-content">
              <div class="template-title-row">
                <i class="bi bi-journal-text"></i>
                <h4>{{ template.name }}</h4>
              </div>
              <p class="text-muted">{{ template.description || 'Sem descricao' }}</p>
              <small class="text-muted">
                Salvo em {{ template.created_at | date:'dd/MM/yyyy HH:mm' }}
              </small>
            </div>
            <div class="template-actions">
              <button class="btn btn-sm btn-secondary" (click)="useTemplate(template)">
                Usar
              </button>
              <button class="btn btn-sm btn-link text-error" (click)="deleteTemplate(template)">
                Excluir
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-6);
    }

    .manager-grid {
      display: grid;
      grid-template-columns: minmax(320px, 420px) 1fr;
      gap: var(--spacing-6);
      align-items: start;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .empty-state {
      text-align: center;
      padding: var(--spacing-8);
    }

    .template-item {
      display: flex;
      justify-content: space-between;
      gap: var(--spacing-4);
      border: 1px solid var(--color-gray-200);
      border-radius: var(--border-radius-md);
      padding: var(--spacing-4);
      margin-bottom: var(--spacing-3);
    }

    .template-title-row {
      display: flex;
      align-items: center;
      gap: var(--spacing-2);
      margin-bottom: var(--spacing-1);

      h4 {
        margin: 0;
      }
    }

    .template-actions {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: var(--spacing-2);
      min-width: 120px;
    }

    .tags-input-container {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-2);
    }

    .selected-tags {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-2);
    }

    .tag-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      background-color: var(--color-primary);
      color: white;
      border-radius: var(--border-radius-md);
      font-size: var(--font-size-sm);
    }

    .tag-remove {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      padding: 0;
      line-height: 1;
      font-size: 16px;
      opacity: 0.8;

      &:hover {
        opacity: 1;
      }
    }

    .tag-input-row {
      display: flex;
      gap: var(--spacing-2);
    }

    @media (max-width: 980px) {
      .manager-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class FormTemplateManagerComponent implements OnInit {
    private formService = inject(FormService);
    private templateService = inject(FormTemplateService);
    private router = inject(Router);

    forms = signal<Form[]>([]);
    templates = signal<SavedFormTemplate[]>([]);
    loadingForms = signal(true);
    saving = signal(false);

    templateData = signal({
        name: '',
        description: '',
        sourceFormId: '',
        tags: [] as string[]
    });

    newTag = '';

    async ngOnInit() {
        await this.loadForms();
        await this.loadTemplates();
    }

    updateTemplateData(key: string, value: string) {
        this.templateData.update(data => ({ ...data, [key]: value }));
    }

    addTag() {
        const tag = this.newTag.trim();
        if (tag && !this.templateData().tags.includes(tag)) {
            this.templateData.update(data => ({ ...data, tags: [...data.tags, tag] }));
        }
        this.newTag = '';
    }

    removeTag(index: number) {
        const tags = [...this.templateData().tags];
        tags.splice(index, 1);
        this.templateData.update(data => ({ ...data, tags }));
    }

    async loadForms() {
        try {
            this.loadingForms.set(true);
            const forms = await this.formService.getForms();
            this.forms.set(forms);
        } catch (error) {
            console.error('Erro ao carregar formularios para templates:', error);
            alert('Nao foi possivel carregar formularios.');
        } finally {
            this.loadingForms.set(false);
        }
    }

    async loadTemplates() {
        const templates = await this.templateService.getTemplates();
        this.templates.set(templates);
    }

    async saveTemplate() {
        const data = this.templateData();

        if (!data.name.trim() || !data.sourceFormId) {
            alert('Preencha nome e selecione um formulario base.');
            return;
        }

        const sourceForm = this.forms().find(form => form.id === data.sourceFormId);
        if (!sourceForm) {
            alert('Formulario base nao encontrado.');
            return;
        }

        try {
            this.saving.set(true);
            const fields = await this.formService.getFormFields(sourceForm.id);
            const template = this.templateService.createTemplateFromForm(
                data.name.trim(),
                data.description.trim(),
                sourceForm,
                fields,
                data.tags
            );

            await this.templateService.saveTemplate(template);
            await this.loadTemplates();
            this.templateData.set({
                name: '',
                description: '',
                sourceFormId: '',
                tags: []
            });
        } catch (error) {
            console.error('Erro ao salvar modelo:', error);
            alert('Erro ao salvar modelo.');
        } finally {
            this.saving.set(false);
        }
    }

    async useTemplate(template: SavedFormTemplate) {
        try {
            const created = await this.formService.createFromTemplate(template);
            this.router.navigate(['/admin/forms', created.id]);
        } catch (error) {
            console.error('Erro ao criar formulario com modelo salvo:', error);
            alert('Erro ao usar modelo salvo.');
        }
    }

    async deleteTemplate(template: SavedFormTemplate) {
        if (!confirm(`Excluir o modelo "${template.name}"?`)) return;
        await this.templateService.deleteTemplate(template.id);
        await this.loadTemplates();
    }
}
