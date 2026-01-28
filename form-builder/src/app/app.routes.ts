import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';


export const routes: Routes = [
    {
        path: '',
        redirectTo: 'admin',
        pathMatch: 'full'
    },
    {
        path: 'admin',
        loadComponent: () => import('./features/admin/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
        canActivate: [AuthGuard],

        children: [
            {
                path: '',
                redirectTo: 'forms',
                pathMatch: 'full'
            },
            {
                path: 'forms',
                loadComponent: () => import('./features/admin/form-list/form-list.component').then(m => m.FormListComponent)
            },
            {
                path: 'forms/new',
                loadComponent: () => import('./features/admin/form-editor/form-editor.component').then(m => m.FormEditorComponent)
            },
            {
                path: 'forms/:id',
                loadComponent: () => import('./features/admin/form-editor/form-editor.component').then(m => m.FormEditorComponent)
            },
            {
                path: 'forms/:id/responses',
                loadComponent: () => import('./features/admin/form-responses/form-responses.component').then(m => m.FormResponsesComponent)
            }
        ]
    },
    {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
    },
    {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
    },
    {
        path: 'f/:slug',
        loadComponent: () => import('./features/public/form-view/form-view.component').then(m => m.FormViewComponent)
    },
    {
        path: 'f/:slug/success',
        loadComponent: () => import('./features/public/form-success/form-success.component').then(m => m.FormSuccessComponent)
    },
    {
        path: '**',
        redirectTo: 'admin'
    }
];
