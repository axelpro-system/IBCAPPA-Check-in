import { Injectable, inject } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {
    private router = inject(Router);
    private authService = inject(AuthService);

    async canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
        console.log('[AuthGuard] Verificando acesso à rota:', state.url);

        try {
            // Aguardar inicialização do serviço de autenticação
            await this.authService.waitForInit();

            // Verificar sessão
            const session = await this.authService.getSession();

            if (session) {
                console.log('[AuthGuard] Acesso permitido - usuário autenticado:', session.user.email);
                return true;
            }

            // Não autenticado, redirecionar para login
            console.log('[AuthGuard] Acesso negado - redirecionando para login');
            this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
            return false;
        } catch (error) {
            console.error('[AuthGuard] Erro na verificação de autenticação:', error);
            this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
            return false;
        }
    }
}
