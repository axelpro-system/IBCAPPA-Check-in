import { Injectable } from '@angular/core';
import { CreateFieldDTO, CreateFormDTO, Form, FormField } from '../models/form.model';
import { SupabaseService } from './supabase.service';

export interface SavedFormTemplate {
    id: string;
    name: string;
    description: string;
    icon: string;
    created_at: string;
    source_form_id: string;
    form: CreateFormDTO;
    fields: Omit<CreateFieldDTO, 'form_id'>[];
}

const STORAGE_KEY = 'form_builder_saved_templates_v1';

@Injectable({
    providedIn: 'root'
})
export class FormTemplateService {
    constructor(private supabase: SupabaseService) { }

    private getLocalTemplates(): SavedFormTemplate[] {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];

        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    private setLocalTemplates(templates: SavedFormTemplate[]): void {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    }

    async getTemplates(): Promise<SavedFormTemplate[]> {
        const user = await this.supabase.getCurrentUser();
        if (!user) return this.getLocalTemplates();

        const { data, error } = await this.supabase.client
            .from('form_templates')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.warn('[FormTemplateService] fallback para localStorage:', error.message);
            return this.getLocalTemplates();
        }

        return (data || []).map((row: any) => ({
            id: row.id,
            name: row.name,
            description: row.description || '',
            icon: row.icon || 'bi-journal-text',
            created_at: row.created_at,
            source_form_id: row.source_form_id,
            form: row.form_data,
            fields: row.fields_data || []
        }));
    }

    async saveTemplate(template: SavedFormTemplate): Promise<void> {
        const user = await this.supabase.getCurrentUser();
        if (!user) {
            const templates = this.getLocalTemplates();
            templates.unshift(template);
            this.setLocalTemplates(templates);
            return;
        }

        const { error } = await this.supabase.client
            .from('form_templates')
            .insert({
                name: template.name,
                description: template.description,
                icon: template.icon,
                source_form_id: template.source_form_id,
                form_data: template.form,
                fields_data: template.fields,
                created_by: user.id
            });

        if (error) {
            console.warn('[FormTemplateService] erro no Supabase, salvando local:', error.message);
            const templates = this.getLocalTemplates();
            templates.unshift(template);
            this.setLocalTemplates(templates);
        }
    }

    async deleteTemplate(id: string): Promise<void> {
        const user = await this.supabase.getCurrentUser();
        if (!user) {
            const templates = this.getLocalTemplates().filter(t => t.id !== id);
            this.setLocalTemplates(templates);
            return;
        }

        const { error } = await this.supabase.client
            .from('form_templates')
            .delete()
            .eq('id', id);

        if (error) {
            console.warn('[FormTemplateService] erro ao remover do Supabase, removendo local:', error.message);
            const templates = this.getLocalTemplates().filter(t => t.id !== id);
            this.setLocalTemplates(templates);
        }
    }

    createTemplateFromForm(
        name: string,
        description: string,
        sourceForm: Form,
        sourceFields: FormField[]
    ): SavedFormTemplate {
        const templateId = `custom-${Date.now().toString(36)}`;

        return {
            id: templateId,
            name,
            description,
            icon: 'bi-journal-text',
            created_at: new Date().toISOString(),
            source_form_id: sourceForm.id,
            form: {
                title: sourceForm.title,
                description: sourceForm.description || '',
                slug: sourceForm.slug || this.generateSlug(name),
                status: 'draft',
                settings: sourceForm.settings || {}
            },
            fields: sourceFields.map(field => ({
                label: field.label,
                field_type: field.field_type,
                placeholder: field.placeholder || '',
                help_text: field.help_text || '',
                required: field.required,
                options: field.options || [],
                validation: field.validation || {},
                logic: field.logic,
                field_order: field.field_order
            }))
        };
    }

    private generateSlug(title: string): string {
        return title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
            .substring(0, 50);
    }
}
