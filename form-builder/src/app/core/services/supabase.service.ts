import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class SupabaseService {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(
            environment.supabaseUrl,
            environment.supabaseKey
        );
    }

    get client(): SupabaseClient {
        return this.supabase;
    }

    get auth() {
        return this.supabase.auth;
    }

    // Método para obter o usuário atual
    async getCurrentUser() {
        const { data: { user } } = await this.supabase.auth.getUser();
        return user;
    }

    // Método para verificar se está autenticado
    async isAuthenticated(): Promise<boolean> {
        const user = await this.getCurrentUser();
        return !!user;
    }
}
