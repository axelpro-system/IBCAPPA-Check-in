import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Form } from '../../../core/models/form.model';
import { FormService } from '../../../core/services/form.service';
import { AnalyticsService, FormEventRecord } from '../../../core/services/analytics.service';

interface FunnelStats {
  views: number;
  starts: number;
  submits: number;
  viewToStartRate: number;
  startToSubmitRate: number;
}

interface FieldAbandonmentRow {
  fieldLabel: string;
  focusCount: number;
  blurCount: number;
  abandonments: number;
  abandonmentRate: number;
}

interface PageStatsRow {
  pageSlug: string;
  views: number;
  starts: number;
  submits: number;
  conversionRate: number;
}

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <div>
        <h1>Analytics</h1>
        <p class="text-muted">Funil de conversao e abandono por campo/pagina.</p>
      </div>
    </div>

    <div class="card filters-card">
      <div class="card-body filters-grid">
        <div class="form-group">
          <label class="form-label">Formulario</label>
          <select class="form-select" [(ngModel)]="filters.formId">
            <option value="">Todos</option>
            <option *ngFor="let form of forms()" [value]="form.id">{{ form.title }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">De</label>
          <input type="date" class="form-input" [(ngModel)]="filters.fromDate">
        </div>
        <div class="form-group">
          <label class="form-label">Ate</label>
          <input type="date" class="form-input" [(ngModel)]="filters.toDate">
        </div>
        <div class="filters-actions">
          <button class="btn btn-secondary" (click)="clearFilters()">Limpar</button>
          <button class="btn btn-primary" (click)="loadAnalytics()" [disabled]="loading()">
            {{ loading() ? 'Carregando...' : 'Aplicar' }}
          </button>
        </div>
      </div>
    </div>

    <div *ngIf="loading()" class="loading-container">
      <div class="spinner spinner-lg"></div>
    </div>

    <ng-container *ngIf="!loading()">
      <div class="stats-grid">
        <div class="card stat-card">
          <div class="card-body">
            <p class="stat-label">Visualizacoes</p>
            <h3>{{ funnel().views }}</h3>
          </div>
        </div>
        <div class="card stat-card">
          <div class="card-body">
            <p class="stat-label">Inicios</p>
            <h3>{{ funnel().starts }}</h3>
          </div>
        </div>
        <div class="card stat-card">
          <div class="card-body">
            <p class="stat-label">Envios</p>
            <h3>{{ funnel().submits }}</h3>
          </div>
        </div>
        <div class="card stat-card">
          <div class="card-body">
            <p class="stat-label">Conversao Inicio > Envio</p>
            <h3>{{ funnel().startToSubmitRate }}%</h3>
          </div>
        </div>
      </div>

      <div class="section-grid">
        <div class="card">
          <div class="card-header">
            <h3>Abandono por Campo</h3>
          </div>
          <div class="card-body table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th>Campo</th>
                  <th>Foco</th>
                  <th>Blur</th>
                  <th>Abandonos</th>
                  <th>Taxa</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let row of fieldAbandonment()">
                  <td>{{ row.fieldLabel }}</td>
                  <td>{{ row.focusCount }}</td>
                  <td>{{ row.blurCount }}</td>
                  <td>{{ row.abandonments }}</td>
                  <td>{{ row.abandonmentRate }}%</td>
                </tr>
                <tr *ngIf="fieldAbandonment().length === 0">
                  <td colspan="5" class="text-muted">Sem dados para o periodo selecionado.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>Conversao por Pagina</h3>
          </div>
          <div class="card-body table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th>Pagina</th>
                  <th>Views</th>
                  <th>Inicios</th>
                  <th>Envios</th>
                  <th>Conversao</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let row of pageStats()">
                  <td>{{ row.pageSlug }}</td>
                  <td>{{ row.views }}</td>
                  <td>{{ row.starts }}</td>
                  <td>{{ row.submits }}</td>
                  <td>{{ row.conversionRate }}%</td>
                </tr>
                <tr *ngIf="pageStats().length === 0">
                  <td colspan="5" class="text-muted">Sem dados para o periodo selecionado.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ng-container>
  `,
  styles: [`
    .page-header {
      margin-bottom: var(--spacing-6);
    }

    .filters-card {
      margin-bottom: var(--spacing-4);
    }

    .filters-grid {
      display: grid;
      grid-template-columns: minmax(240px, 1fr) repeat(2, minmax(160px, 200px)) auto;
      gap: var(--spacing-3);
      align-items: end;
    }

    .filters-actions {
      display: flex;
      gap: var(--spacing-2);
      justify-content: flex-end;
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
      margin-bottom: var(--spacing-4);
    }

    .stat-label {
      margin: 0 0 var(--spacing-2);
      color: var(--color-gray-500);
      font-size: var(--font-size-sm);
    }

    .stat-card h3 {
      margin: 0;
      font-size: 1.8rem;
    }

    .section-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--spacing-4);
    }

    .table-wrap {
      overflow-x: auto;
    }

    @media (max-width: 1100px) {
      .filters-grid {
        grid-template-columns: 1fr;
      }

      .filters-actions {
        justify-content: flex-start;
      }

      .stats-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .section-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AnalyticsDashboardComponent implements OnInit {
  private formService = inject(FormService);
  private analyticsService = inject(AnalyticsService);

  forms = signal<Form[]>([]);
  events = signal<FormEventRecord[]>([]);
  loading = signal(true);

  funnel = signal<FunnelStats>({
    views: 0,
    starts: 0,
    submits: 0,
    viewToStartRate: 0,
    startToSubmitRate: 0
  });
  fieldAbandonment = signal<FieldAbandonmentRow[]>([]);
  pageStats = signal<PageStatsRow[]>([]);

  filters = {
    formId: '',
    fromDate: '',
    toDate: ''
  };

  async ngOnInit() {
    this.forms.set(await this.formService.getForms().catch(() => []));
    await this.loadAnalytics();
  }

  async loadAnalytics() {
    try {
      this.loading.set(true);
      const filteredEvents = await this.analyticsService.getFormEvents({
        formId: this.filters.formId || undefined,
        fromDate: this.filters.fromDate || undefined,
        toDate: this.filters.toDate || undefined
      });

      this.events.set(filteredEvents);
      this.computeFunnel(filteredEvents);
      this.computeFieldAbandonment(filteredEvents);
      this.computePageStats(filteredEvents);
    } finally {
      this.loading.set(false);
    }
  }

  clearFilters() {
    this.filters = {
      formId: '',
      fromDate: '',
      toDate: ''
    };
    this.loadAnalytics();
  }

  private computeFunnel(events: FormEventRecord[]) {
    const views = new Set(events.filter(e => e.event_type === 'view_form').map(e => e.session_id)).size;
    const starts = new Set(events.filter(e => e.event_type === 'start_form').map(e => e.session_id)).size;
    const submits = new Set(events.filter(e => e.event_type === 'submit_success').map(e => e.session_id)).size;

    const viewToStartRate = views > 0 ? Math.round((starts / views) * 100) : 0;
    const startToSubmitRate = starts > 0 ? Math.round((submits / starts) * 100) : 0;

    this.funnel.set({
      views,
      starts,
      submits,
      viewToStartRate,
      startToSubmitRate
    });
  }

  private computeFieldAbandonment(events: FormEventRecord[]) {
    const byField = new Map<string, { label: string; focus: number; blur: number }>();

    for (const event of events) {
      if (!event.field_id && !event.field_label) continue;
      const key = event.field_id || event.field_label || 'unknown';
      const existing = byField.get(key) || {
        label: event.field_label || `Campo ${key}`,
        focus: 0,
        blur: 0
      };

      if (event.event_type === 'field_focus') existing.focus += 1;
      if (event.event_type === 'field_blur') existing.blur += 1;
      byField.set(key, existing);
    }

    const rows: FieldAbandonmentRow[] = Array.from(byField.values())
      .map(item => {
        const abandonments = Math.max(0, item.focus - item.blur);
        const abandonmentRate = item.focus > 0 ? Math.round((abandonments / item.focus) * 100) : 0;
        return {
          fieldLabel: item.label,
          focusCount: item.focus,
          blurCount: item.blur,
          abandonments,
          abandonmentRate
        };
      })
      .sort((a, b) => b.abandonments - a.abandonments);

    this.fieldAbandonment.set(rows);
  }

  private computePageStats(events: FormEventRecord[]) {
    const pages = new Map<string, { views: number; starts: number; submits: number }>();

    for (const event of events) {
      const slug = event.page_slug || 'sem-slug';
      const existing = pages.get(slug) || { views: 0, starts: 0, submits: 0 };
      if (event.event_type === 'view_form') existing.views += 1;
      if (event.event_type === 'start_form') existing.starts += 1;
      if (event.event_type === 'submit_success') existing.submits += 1;
      pages.set(slug, existing);
    }

    const rows: PageStatsRow[] = Array.from(pages.entries())
      .map(([pageSlug, data]) => ({
        pageSlug,
        views: data.views,
        starts: data.starts,
        submits: data.submits,
        conversionRate: data.starts > 0 ? Math.round((data.submits / data.starts) * 100) : 0
      }))
      .sort((a, b) => b.views - a.views);

    this.pageStats.set(rows);
  }
}
