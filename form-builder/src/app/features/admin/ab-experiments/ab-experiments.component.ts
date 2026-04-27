import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Form } from '../../../core/models/form.model';
import { FormService } from '../../../core/services/form.service';
import { AbExperiment, AbTestingService, AbVariant } from '../../../core/services/ab-testing.service';
import { AnalyticsService } from '../../../core/services/analytics.service';

interface ExperimentMetricRow {
  variantName: string;
  starts: number;
  submits: number;
  conversionRate: number;
}

@Component({
  selector: 'app-ab-experiments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <div>
        <h1>A/B Tests</h1>
        <p class="text-muted">Crie experimentos e acompanhe conversao por variante.</p>
      </div>
    </div>

    <div class="card create-card">
      <div class="card-header">
        <h3>Novo Experimento</h3>
      </div>
      <div class="card-body create-grid">
        <div class="form-group">
          <label class="form-label">Formulario</label>
          <select class="form-select" [(ngModel)]="newExperiment.formId">
            <option value="">Selecione...</option>
            <option *ngFor="let form of forms()" [value]="form.id">{{ form.title }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Nome</label>
          <input class="form-input" [(ngModel)]="newExperiment.name" placeholder="Ex: Titulo curto vs longo">
        </div>
        <div class="form-group">
          <label class="form-label">Variante A</label>
          <input class="form-input" [(ngModel)]="newExperiment.variantAName" placeholder="Controle">
        </div>
        <div class="form-group">
          <label class="form-label">Variante B</label>
          <input class="form-input" [(ngModel)]="newExperiment.variantBName" placeholder="Teste">
        </div>
        <div class="form-group full">
          <label class="form-label">Config JSON Variante B (opcional)</label>
          <textarea class="form-textarea" rows="3" [(ngModel)]="newExperiment.variantBConfigJson"
            placeholder='{"title":"Novo titulo","description":"Nova descricao"}'></textarea>
        </div>
        <div class="actions">
          <button class="btn btn-primary" [disabled]="saving()" (click)="createExperiment()">
            {{ saving() ? 'Criando...' : 'Criar Experimento' }}
          </button>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>Experimentos</h3>
      </div>
      <div class="card-body">
        <div *ngIf="experiments().length === 0" class="text-muted">Nenhum experimento criado.</div>
        <div *ngFor="let exp of experiments()" class="experiment-item">
          <div class="exp-main">
            <div>
              <strong>{{ exp.name }}</strong>
              <p class="text-muted">Status: {{ exp.status }} | Criado em {{ exp.created_at | date:'dd/MM/yyyy HH:mm' }}</p>
            </div>
            <div class="exp-actions">
              <button class="btn btn-sm btn-secondary" (click)="setStatus(exp, 'running')">Iniciar</button>
              <button class="btn btn-sm btn-secondary" (click)="setStatus(exp, 'paused')">Pausar</button>
              <button class="btn btn-sm btn-secondary" (click)="setStatus(exp, 'finished')">Finalizar</button>
              <button class="btn btn-sm btn-primary" (click)="loadMetrics(exp)">Metricas</button>
            </div>
          </div>

          <div *ngIf="selectedExperimentId() === exp.id" class="metrics-table">
            <table class="table">
              <thead>
                <tr>
                  <th>Variante</th>
                  <th>Inicios</th>
                  <th>Envios</th>
                  <th>Conversao</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let row of metrics()">
                  <td>{{ row.variantName }}</td>
                  <td>{{ row.starts }}</td>
                  <td>{{ row.submits }}</td>
                  <td>{{ row.conversionRate }}%</td>
                </tr>
                <tr *ngIf="metrics().length === 0">
                  <td colspan="4" class="text-muted">Sem dados de evento para esse experimento.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: var(--spacing-6); }
    .create-card { margin-bottom: var(--spacing-4); }
    .create-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--spacing-3);
    }
    .full { grid-column: 1 / -1; }
    .actions { grid-column: 1 / -1; display: flex; justify-content: flex-end; }
    .experiment-item {
      border: 1px solid var(--color-gray-200);
      border-radius: var(--border-radius-md);
      padding: var(--spacing-4);
      margin-bottom: var(--spacing-3);
    }
    .exp-main {
      display: flex;
      justify-content: space-between;
      gap: var(--spacing-4);
      align-items: center;
    }
    .exp-actions { display: flex; gap: var(--spacing-2); flex-wrap: wrap; }
    .metrics-table { margin-top: var(--spacing-3); overflow-x: auto; }
    @media (max-width: 980px) {
      .create-grid { grid-template-columns: 1fr; }
      .actions { justify-content: flex-start; }
      .exp-main { flex-direction: column; align-items: flex-start; }
    }
  `]
})
export class AbExperimentsComponent implements OnInit {
  private formService = inject(FormService);
  private abService = inject(AbTestingService);
  private analyticsService = inject(AnalyticsService);

  forms = signal<Form[]>([]);
  experiments = signal<AbExperiment[]>([]);
  saving = signal(false);
  selectedExperimentId = signal<string | null>(null);
  metrics = signal<ExperimentMetricRow[]>([]);

  newExperiment = {
    formId: '',
    name: '',
    variantAName: 'Controle',
    variantBName: 'Teste',
    variantBConfigJson: ''
  };

  async ngOnInit() {
    this.forms.set(await this.formService.getForms().catch(() => []));
    await this.loadExperiments();
  }

  async loadExperiments() {
    this.experiments.set(await this.abService.getExperiments().catch(() => []));
  }

  async createExperiment() {
    if (!this.newExperiment.formId || !this.newExperiment.name.trim()) {
      alert('Selecione formulario e nome do experimento.');
      return;
    }

    let variantBConfig: Record<string, any> = {};
    if (this.newExperiment.variantBConfigJson.trim()) {
      try {
        variantBConfig = JSON.parse(this.newExperiment.variantBConfigJson);
      } catch {
        alert('JSON da variante B invalido.');
        return;
      }
    }

    try {
      this.saving.set(true);
      await this.abService.createExperiment({
        formId: this.newExperiment.formId,
        name: this.newExperiment.name.trim(),
        variants: [
          { name: this.newExperiment.variantAName.trim() || 'Controle', weight: 50, config: {} },
          { name: this.newExperiment.variantBName.trim() || 'Teste', weight: 50, config: variantBConfig }
        ]
      });

      this.newExperiment = {
        formId: '',
        name: '',
        variantAName: 'Controle',
        variantBName: 'Teste',
        variantBConfigJson: ''
      };
      await this.loadExperiments();
    } catch (error) {
      console.error('Erro ao criar experimento:', error);
      alert('Erro ao criar experimento.');
    } finally {
      this.saving.set(false);
    }
  }

  async setStatus(exp: AbExperiment, status: AbExperiment['status']) {
    try {
      await this.abService.updateExperimentStatus(exp.id, status);
      await this.loadExperiments();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status do experimento.');
    }
  }

  async loadMetrics(exp: AbExperiment) {
    this.selectedExperimentId.set(exp.id);
    const variants = await this.abService.getVariants(exp.id).catch(() => []);
    const events = await this.analyticsService.getFormEvents({ formId: exp.form_id }).catch(() => []);

    const rows: ExperimentMetricRow[] = variants.map((variant: AbVariant) => {
      const startEvents = events.filter(e =>
        e.event_type === 'start_form'
        && e.metadata?.['experiment_id'] === exp.id
        && e.metadata?.['variant_id'] === variant.id
      );
      const submitEvents = events.filter(e =>
        e.event_type === 'submit_success'
        && e.metadata?.['experiment_id'] === exp.id
        && e.metadata?.['variant_id'] === variant.id
      );

      const starts = new Set(startEvents.map(e => e.session_id)).size;
      const submits = new Set(submitEvents.map(e => e.session_id)).size;
      const conversionRate = starts > 0 ? Math.round((submits / starts) * 100) : 0;

      return {
        variantName: variant.name,
        starts,
        submits,
        conversionRate
      };
    });

    this.metrics.set(rows);
  }
}
