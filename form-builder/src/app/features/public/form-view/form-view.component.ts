import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FormService } from '../../../core/services/form.service';
import { ValidationService } from '../../../core/services/validation.service';
import { Form, FormField } from '../../../core/models/form.model';

@Component({
    selector: 'app-form-view',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <!-- Loading -->
    <div *ngIf="loading" class="loading-page">
      <div class="spinner spinner-lg"></div>
    </div>

    <!-- Not Found -->
    <div *ngIf="!loading && !form" class="error-page">
      <div class="error-content">
        <h1>404</h1>
        <h2>Formulário não encontrado</h2>
        <p class="text-muted">O formulário que você procura não existe ou foi arquivado.</p>
      </div>
    </div>

    <!-- Form -->
    <div *ngIf="!loading && form" class="form-page">
      <div class="form-container">
        <!-- Header -->
        <header class="form-header">
          <h1>{{ form.title }}</h1>
          <p *ngIf="form.description" class="form-description">{{ form.description }}</p>
        </header>

        <!-- Form Fields -->
        <form (ngSubmit)="submitForm()" #formRef="ngForm">
          <div *ngFor="let field of fields" class="form-group">
            <label class="form-label" [for]="field.id">
              {{ field.label }}
              <span *ngIf="field.required" class="required">*</span>
            </label>

            <!-- Text -->
            <input *ngIf="field.field_type === 'text'"
                   [id]="field.id"
                   type="text"
                   class="form-input"
                   [class.is-invalid]="errors[field.id]"
                   [(ngModel)]="values[field.id]"
                   [name]="field.id"
                   [placeholder]="field.placeholder || ''"
                   [required]="field.required">

            <!-- Email -->
            <input *ngIf="field.field_type === 'email'"
                   [id]="field.id"
                   type="email"
                   class="form-input"
                   [class.is-invalid]="errors[field.id]"
                   [(ngModel)]="values[field.id]"
                   [name]="field.id"
                   [placeholder]="field.placeholder || 'email@exemplo.com'"
                   [required]="field.required"
                   (blur)="validateField(field)">

            <!-- Phone -->
            <input *ngIf="field.field_type === 'phone'"
                   [id]="field.id"
                   type="tel"
                   class="form-input"
                   [class.is-invalid]="errors[field.id]"
                   [(ngModel)]="values[field.id]"
                   [name]="field.id"
                   [placeholder]="field.placeholder || '(00) 00000-0000'"
                   [required]="field.required"
                   (blur)="validateField(field)"
                   (input)="formatPhone(field.id)">

            <!-- CPF -->
            <input *ngIf="field.field_type === 'cpf'"
                   [id]="field.id"
                   type="text"
                   class="form-input"
                   [class.is-invalid]="errors[field.id]"
                   [(ngModel)]="values[field.id]"
                   [name]="field.id"
                   [placeholder]="field.placeholder || '000.000.000-00'"
                   [required]="field.required"
                   maxlength="14"
                   (blur)="validateField(field)"
                   (input)="formatCPF(field.id)">

            <!-- CNPJ -->
            <input *ngIf="field.field_type === 'cnpj'"
                   [id]="field.id"
                   type="text"
                   class="form-input"
                   [class.is-invalid]="errors[field.id]"
                   [(ngModel)]="values[field.id]"
                   [name]="field.id"
                   [placeholder]="field.placeholder || '00.000.000/0000-00'"
                   [required]="field.required"
                   maxlength="18"
                   (blur)="validateField(field)"
                   (input)="formatCNPJ(field.id)">

            <!-- Number -->
            <input *ngIf="field.field_type === 'number'"
                   [id]="field.id"
                   type="number"
                   class="form-input"
                   [class.is-invalid]="errors[field.id]"
                   [(ngModel)]="values[field.id]"
                   [name]="field.id"
                   [placeholder]="field.placeholder || ''"
                   [required]="field.required">

            <!-- Currency -->
            <div *ngIf="field.field_type === 'currency'" class="input-with-prefix">
              <span class="input-prefix">R$</span>
              <input [id]="field.id"
                     type="text"
                     class="form-input"
                     [class.is-invalid]="errors[field.id]"
                     [(ngModel)]="values[field.id]"
                     [name]="field.id"
                     [placeholder]="field.placeholder || '0,00'"
                     [required]="field.required"
                     (input)="formatCurrency(field.id)">
            </div>

            <!-- Date -->
            <input *ngIf="field.field_type === 'date'"
                   [id]="field.id"
                   type="date"
                   class="form-input"
                   [class.is-invalid]="errors[field.id]"
                   [(ngModel)]="values[field.id]"
                   [name]="field.id"
                   [required]="field.required">

            <!-- Textarea -->
            <textarea *ngIf="field.field_type === 'textarea'"
                      [id]="field.id"
                      class="form-textarea"
                      [class.is-invalid]="errors[field.id]"
                      [(ngModel)]="values[field.id]"
                      [name]="field.id"
                      [placeholder]="field.placeholder || ''"
                      [required]="field.required"
                      rows="4"></textarea>

            <!-- Select -->
            <select *ngIf="field.field_type === 'select'"
                    [id]="field.id"
                    class="form-select"
                    [class.is-invalid]="errors[field.id]"
                    [(ngModel)]="values[field.id]"
                    [name]="field.id"
                    [required]="field.required">
              <option value="">Selecione...</option>
              <option *ngFor="let option of field.options" [value]="option.value">
                {{ option.label }}
              </option>
            </select>

            <!-- Radio -->
            <div *ngIf="field.field_type === 'radio'" class="options-group">
              <div *ngFor="let option of field.options" class="form-check">
                <input type="radio"
                       [id]="field.id + '_' + option.value"
                       [name]="field.id"
                       [value]="option.value"
                       [(ngModel)]="values[field.id]"
                       [required]="field.required">
                <label [for]="field.id + '_' + option.value">{{ option.label }}</label>
              </div>
            </div>

            <!-- Checkbox -->
            <div *ngIf="field.field_type === 'checkbox'" class="options-group">
              <div *ngFor="let option of field.options" class="form-check">
                <input type="checkbox"
                       [id]="field.id + '_' + option.value"
                       [value]="option.value"
                       (change)="toggleCheckbox(field.id, option.value, $event)">
                <label [for]="field.id + '_' + option.value">{{ option.label }}</label>
              </div>
            </div>

            <!-- Help Text -->
            <p *ngIf="field.help_text && !errors[field.id]" class="form-help">
              {{ field.help_text }}
            </p>

            <!-- Error -->
            <p *ngIf="errors[field.id]" class="form-error">
              {{ errors[field.id] }}
            </p>
          </div>

          <!-- Submit -->
          <div class="form-actions">
            <button type="submit" 
                    class="btn btn-primary btn-lg btn-block" 
                    [disabled]="submitting">
              {{ submitting ? 'Enviando...' : 'Enviar' }}
            </button>
          </div>

          <!-- Privacy Notice -->
          <p class="privacy-notice">
            Ao enviar este formulário, você concorda com o uso dos dados fornecidos.
          </p>
        </form>
      </div>
    </div>
  `,
    styles: [`
    .loading-page,
    .error-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--color-gray-50);
    }
    
    .error-content {
      text-align: center;
      
      h1 {
        font-size: 6rem;
        font-weight: var(--font-weight-bold);
        color: var(--color-gray-200);
        margin: 0;
        line-height: 1;
      }
      
      h2 {
        margin-bottom: var(--spacing-2);
      }
    }
    
    .form-page {
      min-height: 100vh;
      background-color: var(--color-gray-50);
      padding: var(--spacing-8) var(--spacing-4);
    }
    
    .form-container {
      max-width: 640px;
      margin: 0 auto;
      background-color: var(--color-white);
      border-radius: var(--border-radius-lg);
      box-shadow: var(--shadow-md);
      padding: var(--spacing-8);
    }
    
    .form-header {
      text-align: center;
      margin-bottom: var(--spacing-8);
      padding-bottom: var(--spacing-6);
      border-bottom: 1px solid var(--color-gray-200);
      
      h1 {
        margin-bottom: var(--spacing-2);
        color: var(--color-gray-900);
      }
    }
    
    .form-description {
      color: var(--color-gray-600);
      margin: 0;
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
        color: var(--color-gray-600);
        font-weight: var(--font-weight-medium);
      }
      
      .form-input {
        border-radius: 0 var(--border-radius-md) var(--border-radius-md) 0;
      }
    }
    
    .options-group {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-2);
    }
    
    .form-actions {
      margin-top: var(--spacing-8);
    }
    
    .privacy-notice {
      text-align: center;
      font-size: var(--font-size-sm);
      color: var(--color-gray-500);
      margin-top: var(--spacing-4);
      margin-bottom: 0;
    }
    
    @media (max-width: 640px) {
      .form-page {
        padding: var(--spacing-4);
      }
      
      .form-container {
        padding: var(--spacing-6);
      }
    }
  `]
})
export class FormViewComponent implements OnInit {
    loading = true;
    submitting = false;

    form: Form | null = null;
    fields: FormField[] = [];
    values: Record<string, string> = {};
    errors: Record<string, string> = {};

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private formService: FormService,
        private validationService: ValidationService
    ) { }

    async ngOnInit() {
        const slug = this.route.snapshot.paramMap.get('slug');

        if (slug) {
            await this.loadForm(slug);
        } else {
            this.loading = false;
        }
    }

    async loadForm(slug: string) {
        try {
            this.loading = true;
            this.form = await this.formService.getFormBySlug(slug);

            if (this.form) {
                this.fields = await this.formService.getFormFields(this.form.id);

                // Inicializar valores
                this.fields.forEach(field => {
                    this.values[field.id] = '';
                });
            }
        } catch (error) {
            console.error('Erro ao carregar formulário:', error);
            this.form = null;
        } finally {
            this.loading = false;
        }
    }

    validateField(field: FormField): boolean {
        const value = this.values[field.id]?.trim() || '';

        // Campo obrigatório
        if (field.required && !value) {
            this.errors[field.id] = 'Este campo é obrigatório';
            return false;
        }

        if (!value) {
            delete this.errors[field.id];
            return true;
        }

        // Validações específicas
        switch (field.field_type) {
            case 'email':
                if (!this.validationService.validateEmail(value)) {
                    this.errors[field.id] = 'Informe um e-mail válido';
                    return false;
                }
                break;

            case 'cpf':
                if (!this.validationService.validateCPF(value)) {
                    this.errors[field.id] = 'CPF inválido';
                    return false;
                }
                break;

            case 'cnpj':
                if (!this.validationService.validateCNPJ(value)) {
                    this.errors[field.id] = 'CNPJ inválido';
                    return false;
                }
                break;

            case 'phone':
                if (!this.validationService.validatePhone(value)) {
                    this.errors[field.id] = 'Telefone inválido';
                    return false;
                }
                break;
        }

        // Validação de nome (se label contiver "nome")
        if (field.field_type === 'text' && field.label.toLowerCase().includes('nome')) {
            const nameValidation = this.validationService.validateName(value);
            if (!nameValidation.valid) {
                this.errors[field.id] = nameValidation.message || 'Nome inválido';
                return false;
            }
        }

        delete this.errors[field.id];
        return true;
    }

    formatCPF(fieldId: string) {
        let value = this.values[fieldId].replace(/\D/g, '');
        if (value.length > 11) value = value.substring(0, 11);

        if (value.length > 9) {
            value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
        } else if (value.length > 6) {
            value = value.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
        } else if (value.length > 3) {
            value = value.replace(/(\d{3})(\d{1,3})/, '$1.$2');
        }

        this.values[fieldId] = value;
    }

    formatCNPJ(fieldId: string) {
        let value = this.values[fieldId].replace(/\D/g, '');
        if (value.length > 14) value = value.substring(0, 14);

        if (value.length > 12) {
            value = value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{1,2})/, '$1.$2.$3/$4-$5');
        } else if (value.length > 8) {
            value = value.replace(/(\d{2})(\d{3})(\d{3})(\d{1,4})/, '$1.$2.$3/$4');
        } else if (value.length > 5) {
            value = value.replace(/(\d{2})(\d{3})(\d{1,3})/, '$1.$2.$3');
        } else if (value.length > 2) {
            value = value.replace(/(\d{2})(\d{1,3})/, '$1.$2');
        }

        this.values[fieldId] = value;
    }

    formatPhone(fieldId: string) {
        let value = this.values[fieldId].replace(/\D/g, '');
        if (value.length > 11) value = value.substring(0, 11);

        if (value.length > 10) {
            value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        } else if (value.length > 6) {
            value = value.replace(/(\d{2})(\d{4,5})(\d{0,4})/, '($1) $2-$3');
        } else if (value.length > 2) {
            value = value.replace(/(\d{2})(\d{0,5})/, '($1) $2');
        }

        this.values[fieldId] = value;
    }

    formatCurrency(fieldId: string) {
        let value = this.values[fieldId].replace(/\D/g, '');
        if (!value) {
            this.values[fieldId] = '';
            return;
        }

        const numValue = parseInt(value) / 100;
        this.values[fieldId] = numValue.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    toggleCheckbox(fieldId: string, optionValue: string, event: Event) {
        const checked = (event.target as HTMLInputElement).checked;
        let currentValues = this.values[fieldId] ? this.values[fieldId].split(',') : [];

        if (checked) {
            currentValues.push(optionValue);
        } else {
            currentValues = currentValues.filter(v => v !== optionValue);
        }

        this.values[fieldId] = currentValues.join(',');
    }

    async submitForm() {
        // Validar todos os campos
        let hasErrors = false;

        for (const field of this.fields) {
            if (!this.validateField(field)) {
                hasErrors = true;
            }
        }

        if (hasErrors) {
            // Scroll para o primeiro erro
            const firstErrorField = this.fields.find(f => this.errors[f.id]);
            if (firstErrorField) {
                document.getElementById(firstErrorField.id)?.focus();
            }
            return;
        }

        try {
            this.submitting = true;

            await this.formService.submitForm({
                form_id: this.form!.id,
                values: this.values
            });

            // Redirecionar para página de sucesso
            this.router.navigate(['/f', this.form!.slug, 'success']);
        } catch (error) {
            console.error('Erro ao enviar formulário:', error);
            alert('Erro ao enviar formulário. Tente novamente.');
        } finally {
            this.submitting = false;
        }
    }
}
