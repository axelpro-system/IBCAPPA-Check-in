import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class SupabaseService {
    private supabase: SupabaseClient;

    constructor() {
        console.log('[SupabaseService] Inicializando cliente Supabase...');
        console.log('[SupabaseService] URL:', environment.supabaseUrl);

        this.supabase = createClient(
            environment.supabaseUrl,
            environment.supabaseKey,
            {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                }
            }
        );

        // Debug: verificar estado inicial da sessão
        this.verifyConnection();
    }

    private async verifyConnection() {
        try {
            const { data: { session }, error } = await this.supabase.auth.getSession();
            console.log('[SupabaseService] Sessão atual:', session ? 'ATIVA' : 'INATIVA');
            console.log('[SupabaseService] Usuário:', session?.user?.email || 'Não autenticado');
            if (error) {
                console.error('[SupabaseService] Erro ao verificar sessão:', error);
            }
        } catch (e) {
            console.error('[SupabaseService] Erro ao verificar conexão:', e);
        }
    }

    get client(): SupabaseClient {
        return this.supabase;
    }

    get auth() {
        return this.supabase.auth;
    }

    // Método para obter o usuário atual
    async getCurrentUser() {
        console.log('[SupabaseService] getCurrentUser chamado');
        const { data: { user }, error } = await this.supabase.auth.getUser();
        if (error) {
            console.error('[SupabaseService] Erro ao obter usuário:', error);
        }
        console.log('[SupabaseService] Usuário atual:', user?.email || 'null');
        return user;
    }

    // Método para verificar se está autenticado
    async isAuthenticated(): Promise<boolean> {
        const user = await this.getCurrentUser();
        const isAuth = !!user;
        console.log('[SupabaseService] isAuthenticated:', isAuth);
        return isAuth;
    }

    // Método para debug - testar conectividade
    async testConnection(): Promise<{ success: boolean; error?: string }> {
        try {
            console.log('[SupabaseService] Testando conexão...');
            const { data, error } = await this.supabase
                .from('forms')
                .select('count', { count: 'exact', head: true });

            if (error) {
                console.error('[SupabaseService] Erro no teste de conexão:', error);
                return { success: false, error: error.message };
            }

            console.log('[SupabaseService] Conexão OK');
            return { success: true };
        } catch (e: any) {
            console.error('[SupabaseService] Exceção no teste de conexão:', e);
            return { success: false, error: e.message };
        }
    }
}
