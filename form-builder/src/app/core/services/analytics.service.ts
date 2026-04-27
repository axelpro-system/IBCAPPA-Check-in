import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export type FormEventType =
    | 'view_form'
    | 'start_form'
    | 'field_focus'
    | 'field_change'
    | 'field_blur'
    | 'submit_success'
    | 'submit_error';

export interface FormEventRecord {
    id: string;
    event_type: FormEventType;
    form_id: string;
    field_id?: string | null;
    field_label?: string | null;
    page_slug?: string | null;
    visitor_id: string;
    session_id: string;
    created_at: string;
    metadata?: Record<string, any>;
}

export interface AnalyticsFilters {
    formId?: string;
    fromDate?: string;
    toDate?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AnalyticsService {
    private readonly visitorStorageKey = 'form_builder_visitor_id';
    private readonly sessionStorageKey = 'form_builder_session_id';

    constructor(private supabase: SupabaseService) { }

    getVisitorId(): string {
        const existing = localStorage.getItem(this.visitorStorageKey);
        if (existing) return existing;

        const generated = `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
        localStorage.setItem(this.visitorStorageKey, generated);
        return generated;
    }

    getSessionId(): string {
        const existing = sessionStorage.getItem(this.sessionStorageKey);
        if (existing) return existing;

        const generated = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
        sessionStorage.setItem(this.sessionStorageKey, generated);
        return generated;
    }

    async trackFormEvent(params: {
        eventType: FormEventType;
        formId: string;
        fieldId?: string;
        fieldLabel?: string;
        pageSlug?: string;
        metadata?: Record<string, any>;
    }): Promise<void> {
        const user = await this.supabase.getCurrentUser();

        const payload = {
            event_type: params.eventType,
            form_id: params.formId,
            field_id: params.fieldId || null,
            field_label: params.fieldLabel || null,
            page_slug: params.pageSlug || null,
            visitor_id: this.getVisitorId(),
            session_id: this.getSessionId(),
            user_id: user?.id || null,
            metadata: params.metadata || {}
        };

        const { error } = await this.supabase.client
            .from('form_events')
            .insert(payload);

        if (error) {
            console.warn('[AnalyticsService] erro ao registrar evento:', error.message);
        }
    }

    async getFormEvents(filters?: AnalyticsFilters): Promise<FormEventRecord[]> {
        let query = this.supabase.client
            .from('form_events')
            .select('id,event_type,form_id,field_id,field_label,page_slug,visitor_id,session_id,created_at,metadata')
            .order('created_at', { ascending: false })
            .limit(5000);

        if (filters?.formId) {
            query = query.eq('form_id', filters.formId);
        }

        if (filters?.fromDate) {
            query = query.gte('created_at', `${filters.fromDate}T00:00:00`);
        }

        if (filters?.toDate) {
            query = query.lte('created_at', `${filters.toDate}T23:59:59`);
        }

        const { data, error } = await query;
        if (error) {
            console.warn('[AnalyticsService] erro ao carregar eventos:', error.message);
            return [];
        }

        return (data || []) as FormEventRecord[];
    }
}
