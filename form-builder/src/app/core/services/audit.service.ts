import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export type AuditAction =
    | 'form_created'
    | 'form_updated'
    | 'form_deleted'
    | 'form_published'
    | 'form_archived'
    | 'field_created'
    | 'field_updated'
    | 'field_deleted'
    | 'responses_exported';

@Injectable({
    providedIn: 'root'
})
export class AuditService {
    constructor(private supabase: SupabaseService) { }

    async log(params: {
        action: AuditAction;
        entityType: 'form' | 'form_field' | 'submission';
        entityId?: string | null;
        before?: Record<string, any> | null;
        after?: Record<string, any> | null;
        metadata?: Record<string, any>;
    }): Promise<void> {
        const user = await this.supabase.getCurrentUser();

        if (!user?.id) return;

        const { error } = await this.supabase.client
            .from('audit_logs')
            .insert({
                action: params.action,
                entity_type: params.entityType,
                entity_id: params.entityId || null,
                user_id: user.id,
                before_data: params.before || null,
                after_data: params.after || null,
                metadata: params.metadata || {},
                user_agent: navigator.userAgent
            });

        if (error) {
            console.warn('[AuditService] erro ao registrar auditoria:', error.message);
        }
    }
}
