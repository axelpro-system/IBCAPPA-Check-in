import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import {
    Form,
    FormField,
    FormSubmission,
    SubmissionValue,
    CreateFormDTO,
    CreateFieldDTO,
    SubmitFormDTO,
    SubmissionWithValues
} from '../models/form.model';

@Injectable({
    providedIn: 'root'
})
export class FormService {

    constructor(private supabase: SupabaseService) { }

    // =============================================
    // FORMS - CRUD
    // =============================================

    async getForms(): Promise<Form[]> {
        const { data, error } = await this.supabase.client
            .from('forms')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async getFormById(id: string): Promise<Form | null> {
        console.log('FormService: getFormById request', id);

        const query = this.supabase.client
            .from('forms')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        // Timeout de 5 segundos para evitar hang eterno
        const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout: Supabase request took too long')), 5000)
        );

        const { data, error } = await Promise.race([query, timeout]) as any;

        console.log('FormService: getFormById response', { data, error });
        if (error) throw error;
        return data;
    }

    async getFormBySlug(slug: string): Promise<Form | null> {
        const { data, error } = await this.supabase.client
            .from('forms')
            .select('*')
            .eq('slug', slug)
            .eq('status', 'published')
            .maybeSingle();

        if (error) throw error;
        return data;
    }

    async createForm(form: CreateFormDTO): Promise<Form> {
        const user = await this.supabase.getCurrentUser();

        const { data, error } = await this.supabase.client
            .from('forms')
            .insert({
                ...form,
                created_by: user?.id
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async updateForm(id: string, updates: Partial<Form>): Promise<Form> {
        const { data, error } = await this.supabase.client
            .from('forms')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async deleteForm(id: string): Promise<void> {
        const { error } = await this.supabase.client
            .from('forms')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    async publishForm(id: string): Promise<Form> {
        return this.updateForm(id, { status: 'published' });
    }

    async archiveForm(id: string): Promise<Form> {
        return this.updateForm(id, { status: 'archived' });
    }

    // =============================================
    // FORM FIELDS - CRUD
    // =============================================

    async getFormFields(formId: string): Promise<FormField[]> {
        const { data, error } = await this.supabase.client
            .from('form_fields')
            .select('*')
            .eq('form_id', formId)
            .order('field_order', { ascending: true });

        if (error) throw error;
        return data || [];
    }

    async createField(field: CreateFieldDTO): Promise<FormField> {
        // Obter a maior ordem atual
        const { data: fields } = await this.supabase.client
            .from('form_fields')
            .select('field_order')
            .eq('form_id', field.form_id)
            .order('field_order', { ascending: false })
            .limit(1);

        const maxOrder = fields && fields.length > 0 ? fields[0].field_order : -1;

        const { data, error } = await this.supabase.client
            .from('form_fields')
            .insert({
                ...field,
                field_order: field.field_order ?? maxOrder + 1
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async updateField(id: string, updates: Partial<FormField>): Promise<FormField> {
        const { data, error } = await this.supabase.client
            .from('form_fields')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async deleteField(id: string): Promise<void> {
        const { error } = await this.supabase.client
            .from('form_fields')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    async reorderFields(formId: string, fieldIds: string[]): Promise<void> {
        const updates = fieldIds.map((id, index) => ({
            id,
            field_order: index
        }));

        for (const update of updates) {
            await this.supabase.client
                .from('form_fields')
                .update({ field_order: update.field_order })
                .eq('id', update.id);
        }
    }

    // =============================================
    // SUBMISSIONS
    // =============================================

    async submitForm(submission: SubmitFormDTO): Promise<FormSubmission> {
        // Criar a submissão
        const { data: submissionData, error: submissionError } = await this.supabase.client
            .from('form_submissions')
            .insert({
                form_id: submission.form_id
            })
            .select()
            .single();

        if (submissionError) throw submissionError;

        // Criar os valores
        const values = Object.entries(submission.values).map(([field_id, value]) => ({
            submission_id: submissionData.id,
            field_id,
            value
        }));

        const { error: valuesError } = await this.supabase.client
            .from('submission_values')
            .insert(values);

        if (valuesError) throw valuesError;

        return submissionData;
    }

    async getFormSubmissions(formId: string): Promise<SubmissionWithValues[]> {
        // Buscar submissões
        const { data: submissions, error: submissionsError } = await this.supabase.client
            .from('form_submissions')
            .select('*')
            .eq('form_id', formId)
            .order('submitted_at', { ascending: false });

        if (submissionsError) throw submissionsError;
        if (!submissions || submissions.length === 0) return [];

        // Buscar valores de todas as submissões
        const submissionIds = submissions.map(s => s.id);
        const { data: values, error: valuesError } = await this.supabase.client
            .from('submission_values')
            .select('*')
            .in('submission_id', submissionIds);

        if (valuesError) throw valuesError;

        // Agrupar valores por submissão
        const valuesMap = (values || []).reduce((acc, val) => {
            if (!acc[val.submission_id]) {
                acc[val.submission_id] = {};
            }
            acc[val.submission_id][val.field_id] = val.value;
            return acc;
        }, {} as Record<string, Record<string, string>>);

        // Combinar submissões com valores
        return submissions.map(submission => ({
            ...submission,
            values: valuesMap[submission.id] || {}
        }));
    }

    async getSubmissionCount(formId: string): Promise<number> {
        const { count, error } = await this.supabase.client
            .from('form_submissions')
            .select('*', { count: 'exact', head: true })
            .eq('form_id', formId);

        if (error) throw error;
        return count || 0;
    }

    async deleteSubmission(id: string): Promise<void> {
        const { error } = await this.supabase.client
            .from('form_submissions')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    // =============================================
    // VALIDAÇÕES
    // =============================================

    async validateCPF(cpf: string): Promise<boolean> {
        const { data, error } = await this.supabase.client
            .rpc('validate_cpf', { cpf });

        if (error) throw error;
        return data;
    }

    async validateCNPJ(cnpj: string): Promise<boolean> {
        const { data, error } = await this.supabase.client
            .rpc('validate_cnpj', { cnpj });

        if (error) throw error;
        return data;
    }

    async validateEmail(email: string): Promise<boolean> {
        const { data, error } = await this.supabase.client
            .rpc('validate_email', { email });

        if (error) throw error;
        return data;
    }

    async validatePhone(phone: string): Promise<boolean> {
        const { data, error } = await this.supabase.client
            .rpc('validate_phone_br', { phone });

        if (error) throw error;
        return data;
    }

    async validateName(name: string): Promise<boolean> {
        const { data, error } = await this.supabase.client
            .rpc('validate_name', { name });

        if (error) throw error;
        return data;
    }

    // =============================================
    // HELPERS
    // =============================================

    generateSlug(title: string): string {
        return title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
            .substring(0, 50);
    }
}
