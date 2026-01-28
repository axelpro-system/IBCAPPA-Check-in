import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { User } from '@supabase/supabase-js';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private userSubject = new BehaviorSubject<User | null>(null);
    user$ = this.userSubject.asObservable();

    constructor(
        private supabase: SupabaseService,
        private router: Router
    ) {
        this.initAuth();
    }

    private async initAuth() {
        // Verificar sessão atual
        const { data: { session } } = await this.supabase.auth.getSession();
        this.userSubject.next(session?.user ?? null);

        // Escutar mudanças de autenticação
        this.supabase.auth.onAuthStateChange((event, session) => {
            this.userSubject.next(session?.user ?? null);
        });
    }

    get currentUser(): User | null {
        return this.userSubject.value;
    }

    get isAuthenticated(): boolean {
        return !!this.currentUser;
    }

    async signUp(email: string, password: string): Promise<void> {
        const { error } = await this.supabase.auth.signUp({
            email,
            password
        });

        if (error) throw error;
    }

    async signIn(email: string, password: string): Promise<void> {
        const { error } = await this.supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;
        this.router.navigate(['/admin']);
    }

    async signOut(): Promise<void> {
        const { error } = await this.supabase.auth.signOut();
        if (error) throw error;
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
    async getSession() {
        const { data: { session } } = await this.supabase.auth.getSession();
        return session;
    }
}

