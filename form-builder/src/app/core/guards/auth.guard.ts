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
        const session = await this.authService.getSession();

        if (session) {
            return true;
        }

        // Não autenticado, redirecionar para login
        this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        return false;
    }
}
