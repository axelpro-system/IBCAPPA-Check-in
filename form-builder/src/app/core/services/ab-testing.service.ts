import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface AbExperiment {
    id: string;
    form_id: string;
    name: string;
    status: 'draft' | 'running' | 'paused' | 'finished';
    created_by: string;
    created_at: string;
    started_at?: string | null;
    ended_at?: string | null;
}

export interface AbVariant {
    id: string;
    experiment_id: string;
    name: string;
    weight: number;
    config: Record<string, any>;
}

export interface AbAssignmentContext {
    experiment: AbExperiment;
    variant: AbVariant;
}

@Injectable({
    providedIn: 'root'
})
export class AbTestingService {
    constructor(private supabase: SupabaseService) { }

    async getExperiments(formId?: string): Promise<AbExperiment[]> {
        let query = this.supabase.client
            .from('ab_experiments')
            .select('*')
            .order('created_at', { ascending: false });

        if (formId) query = query.eq('form_id', formId);

        const { data, error } = await query;
        if (error) throw error;
        return (data || []) as AbExperiment[];
    }

    async getVariants(experimentId: string): Promise<AbVariant[]> {
        const { data, error } = await this.supabase.client
            .from('ab_variants')
            .select('*')
            .eq('experiment_id', experimentId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return (data || []) as AbVariant[];
    }

    async createExperiment(input: {
        formId: string;
        name: string;
        variants: Array<{ name: string; weight: number; config?: Record<string, any> }>;
    }): Promise<AbExperiment> {
        const user = await this.supabase.getCurrentUser();
        if (!user) throw new Error('Usuario nao autenticado');

        const { data: experiment, error } = await this.supabase.client
            .from('ab_experiments')
            .insert({
                form_id: input.formId,
                name: input.name,
                status: 'draft',
                created_by: user.id
            })
            .select('*')
            .single();

        if (error) throw error;

        const variantsPayload = input.variants.map(v => ({
            experiment_id: experiment.id,
            name: v.name,
            weight: v.weight,
            config: v.config || {}
        }));

        const { error: variantsError } = await this.supabase.client
            .from('ab_variants')
            .insert(variantsPayload);

        if (variantsError) throw variantsError;
        return experiment as AbExperiment;
    }

    async updateExperimentStatus(experimentId: string, status: AbExperiment['status']): Promise<void> {
        const payload: Record<string, any> = { status };
        if (status === 'running') payload['started_at'] = new Date().toISOString();
        if (status === 'finished') payload['ended_at'] = new Date().toISOString();

        const { error } = await this.supabase.client
            .from('ab_experiments')
            .update(payload)
            .eq('id', experimentId);

        if (error) throw error;
    }

    async resolveAssignment(formId: string, visitorId: string, sessionId?: string): Promise<AbAssignmentContext | null> {
        const { data: experiment, error: experimentError } = await this.supabase.client
            .from('ab_experiments')
            .select('*')
            .eq('form_id', formId)
            .eq('status', 'running')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (experimentError || !experiment) return null;

        const variants = await this.getVariants(experiment.id);
        if (variants.length === 0) return null;

        const { data: existing } = await this.supabase.client
            .from('ab_assignments')
            .select('variant_id')
            .eq('experiment_id', experiment.id)
            .eq('visitor_id', visitorId)
            .maybeSingle();

        let variant: AbVariant | undefined;
        if (existing?.variant_id) {
            variant = variants.find(v => v.id === existing.variant_id);
        }

        if (!variant) {
            variant = this.pickWeightedVariant(variants);
            await this.supabase.client
                .from('ab_assignments')
                .insert({
                    experiment_id: experiment.id,
                    variant_id: variant.id,
                    visitor_id: visitorId,
                    session_id: sessionId || null
                });
        }

        return {
            experiment: experiment as AbExperiment,
            variant
        };
    }

    private pickWeightedVariant(variants: AbVariant[]): AbVariant {
        const totalWeight = variants.reduce((sum, v) => sum + (v.weight || 0), 0);
        if (totalWeight <= 0) return variants[0];

        const random = Math.random() * totalWeight;
        let acc = 0;
        for (const variant of variants) {
            acc += variant.weight || 0;
            if (random <= acc) return variant;
        }

        return variants[variants.length - 1];
    }
}
