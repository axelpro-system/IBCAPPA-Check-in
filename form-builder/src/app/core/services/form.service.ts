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
        console.log('[FormService] getForms - Iniciando carregamento...');

        try {
            // Verificar autenticação primeiro
            const user = await this.supabase.getCurrentUser();
            console.log('[FormService] getForms - Usuário:', user?.email || 'NULO (não autenticado)');

            if (!user) {
                console.warn('[FormService] getForms - AVISO: Usuário não autenticado!');
            }

            const query = this.supabase.client
                .from('forms')
                .select('*')
                .order('created_at', { ascending: false });

            const timeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout: Supabase request took too long (5s)')), 5000)
            );

            console.log('[FormService] getForms - Executando query...');
            const startTime = Date.now();

            const { data, error } = await Promise.race([query, timeout]) as any;

            const elapsed = Date.now() - startTime;
            console.log(`[FormService] getForms - Query completada em ${elapsed}ms`);
            console.log('[FormService] getForms - Resultados:', data?.length || 0, 'formulários');

            if (error) {
                console.error('[FormService] getForms - Erro:', error);
                throw error;
            }

            return data || [];
        } catch (error: any) {
            console.error('[FormService] getForms - Exceção:', error.message);
            throw error;
        }
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
        console.log('[FormService] getFormBySlug - Iniciando busca por slug:', slug);
        try {
            const query = this.supabase.client
                .from('forms')
                .select('*')
                .eq('slug', slug)
                .eq('status', 'published')
                .maybeSingle();

            const timeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout: Supabase query took too long (5s)')), 5000)
            );

            const { data, error } = await Promise.race([query, timeout]) as any;

            console.log('[FormService] getFormBySlug - Resultado:', { data, error });
            if (error) {
                console.error('[FormService] getFormBySlug - Erro:', error);
                throw error;
            }
            return data;
        } catch (error) {
            console.error('[FormService] getFormBySlug - Exceção:', error);
            throw error;
        }
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
        console.log('[FormService] getFormFields - Iniciando busca por formId:', formId);
        try {
            const query = this.supabase.client
                .from('form_fields')
                .select('*')
                .eq('form_id', formId)
                .order('field_order', { ascending: true });

            const timeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout: Supabase query took too long (5s)')), 5000)
            );

            const { data, error } = await Promise.race([query, timeout]) as any;

            console.log('[FormService] getFormFields - Resultado:', data?.length || 0, 'campos encontrados');
            if (error) {
                console.error('[FormService] getFormFields - Erro:', error);
                throw error;
            }
            return data || [];
        } catch (error) {
            console.error('[FormService] getFormFields - Exceção:', error);
            throw error;
        }
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
        // Buscar campos e configurações do formulário antecipadamente
        const fields = await this.getFormFields(submission.form_id);
        const { data: form } = await this.supabase.client
            .from('forms')
            .select('settings')
            .eq('id', submission.form_id)
            .single();

        let clientEmail = '';
        let clientName = '';

        for (const field of fields) {
            const value = submission.values[field.id];
            if (!value) continue;

            if (field.field_type === 'email') {
                clientEmail = value;
            } else if (field.label.toLowerCase().includes('nome') && !clientName) {
                clientName = value;
            }
        }

        const metadata: any = {};
        if (form?.settings?.cademiEnabled) {
            metadata.codigo = Date.now().toString();
            metadata.status = 'aprovado';
            metadata.produto_id = form.settings.cademiProductId;
            metadata.produto_nome = form.settings.cademiProductName;
            metadata.cliente_nome = clientName || 'Cliente';
            metadata.cliente_email = clientEmail;
        }

        // Criar a submissão com metadados
        const { data: submissionData, error: submissionError } = await this.supabase.client
            .from('form_submissions')
            .insert({
                form_id: submission.form_id,
                metadata: metadata
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

        // Disparar integração com Cademí se habilitado
        if (form?.settings?.cademiEnabled && clientEmail) {
            console.log('[FormService] Cademi habilitado, disparando integração...');
            const payload = {
                token: form.settings.cademiToken,
                productId: metadata.produto_id,
                productName: metadata.produto_nome,
                clientName: metadata.cliente_nome,
                clientEmail: clientEmail,
                submissionId: submissionData.id
            };

            this.supabase.client.functions.invoke('cademi-webhook', {
                body: payload
            }).catch(err => {
                console.error('[FormService] Erro ao disparar Cademi:', err);
            });
        }

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
