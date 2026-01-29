import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { User, Session } from '@supabase/supabase-js';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private userSubject = new BehaviorSubject<User | null>(null);
    private sessionSubject = new BehaviorSubject<Session | null>(null);
    private initialized = false;

    user$ = this.userSubject.asObservable();

    constructor(
        private supabase: SupabaseService,
        private router: Router
    ) {
        this.initAuth();
    }

    private async initAuth() {
        console.log('[AuthService] Inicializando autenticação...');

        try {
            // Verificar sessão atual
            const { data: { session }, error } = await this.supabase.auth.getSession();

            if (error) {
                console.error('[AuthService] Erro ao obter sessão:', error);
            } else {
                console.log('[AuthService] Sessão encontrada:', session ? 'SIM' : 'NÃO');
                if (session?.user) {
                    console.log('[AuthService] Usuário:', session.user.email);
                }
            }

            this.sessionSubject.next(session ?? null);
            this.userSubject.next(session?.user ?? null);

            // Escutar mudanças de autenticação
            this.supabase.auth.onAuthStateChange((event, session) => {
                console.log('[AuthService] Evento de auth:', event);
                console.log('[AuthService] Nova sessão:', session ? 'ATIVA' : 'INATIVA');

                this.sessionSubject.next(session ?? null);
                this.userSubject.next(session?.user ?? null);
            });

            this.initialized = true;
            console.log('[AuthService] Inicialização completa');
        } catch (e) {
            console.error('[AuthService] Erro na inicialização:', e);
            this.initialized = true;
        }
    }

    get currentUser(): User | null {
        return this.userSubject.value;
    }

    get currentSession(): Session | null {
        return this.sessionSubject.value;
    }

    get isAuthenticated(): boolean {
        return !!this.currentUser;
    }

    async waitForInit(): Promise<void> {
        if (this.initialized) return;

        // Aguardar até 5 segundos pela inicialização
        return new Promise((resolve) => {
            const maxWait = 5000;
            const interval = 100;
            let waited = 0;

            const check = setInterval(() => {
                if (this.initialized || waited >= maxWait) {
                    clearInterval(check);
                    resolve();
                }
                waited += interval;
            }, interval);
        });
    }

    async signUp(email: string, password: string): Promise<void> {
        console.log('[AuthService] Iniciando cadastro...');
        const { error } = await this.supabase.auth.signUp({
            email,
            password
        });

        if (error) {
            console.error('[AuthService] Erro no cadastro:', error);
            throw error;
        }
        console.log('[AuthService] Cadastro realizado com sucesso');
    }

    async signIn(email: string, password: string): Promise<void> {
        console.log('[AuthService] Iniciando login...');
        const { data, error } = await this.supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            console.error('[AuthService] Erro no login:', error);
            throw error;
        }

        console.log('[AuthService] Login realizado com sucesso');
        console.log('[AuthService] Sessão:', data.session ? 'ATIVA' : 'INATIVA');

        this.router.navigate(['/admin']);
    }

    async signOut(): Promise<void> {
        console.log('[AuthService] Saindo...');
        const { error } = await this.supabase.auth.signOut();
        if (error) {
            console.error('[AuthService] Erro ao sair:', error);
            throw error;
        }
        console.log('[AuthService] Logout realizado');
        this.router.navigate(['/login']);
    }

    async resetPassword(email: string): Promise<void> {
        const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`
        });

        if (error) throw error;
    }

    async updatePassword(newPassword: string): Promise<void> {
        const { error } = await this.supabase.auth.updateUser({
            password: newPassword
        });

        if (error) throw error;
    }

    async getSession(): Promise<Session | null> {
        console.log('[AuthService] getSession chamado');

        // Se já temos sessão em cache e não expirou, usar ela
        const cachedSession = this.sessionSubject.value;
        if (cachedSession) {
            const expiresAt = cachedSession.expires_at;
            const now = Math.floor(Date.now() / 1000);

            if (expiresAt && expiresAt > now) {
                console.log('[AuthService] Usando sessão em cache (válida)');
                return cachedSession;
            }
        }

        // Buscar sessão atualizada
        console.log('[AuthService] Buscando sessão atualizada...');
        const { data: { session }, error } = await this.supabase.auth.getSession();

        if (error) {
            console.error('[AuthService] Erro ao obter sessão:', error);
            return null;
        }

        if (session) {
            this.sessionSubject.next(session);
            this.userSubject.next(session.user);
            console.log('[AuthService] Sessão atualizada:', session.user.email);
        } else {
            console.log('[AuthService] Nenhuma sessão encontrada');
        }

        return session;
    }
}

