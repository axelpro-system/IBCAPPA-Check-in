import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ValidationService {

    // =============================================
    // CPF - Validação completa
    // =============================================

    validateCPF(cpf: string): boolean {
        // Remove caracteres não numéricos
        const cpfClean = cpf.replace(/\D/g, '');

        // Verifica se tem 11 dígitos
        if (cpfClean.length !== 11) return false;

        // Verifica CPFs inválidos conhecidos
        const invalidCPFs = [
            '00000000000', '11111111111', '22222222222', '33333333333',
            '44444444444', '55555555555', '66666666666', '77777777777',
            '88888888888', '99999999999'
        ];
        if (invalidCPFs.includes(cpfClean)) return false;

        // Calcula primeiro dígito verificador
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cpfClean.charAt(i)) * (10 - i);
        }
        let digit1 = (sum * 10) % 11;
        if (digit1 === 10) digit1 = 0;

        // Calcula segundo dígito verificador
        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cpfClean.charAt(i)) * (11 - i);
        }
        let digit2 = (sum * 10) % 11;
        if (digit2 === 10) digit2 = 0;

        // Verifica os dígitos
        return (
            parseInt(cpfClean.charAt(9)) === digit1 &&
            parseInt(cpfClean.charAt(10)) === digit2
        );
    }

    formatCPF(cpf: string): string {
        const cpfClean = cpf.replace(/\D/g, '');
        if (cpfClean.length !== 11) return cpf;
        return cpfClean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }

    // =============================================
    // CNPJ - Validação completa
    // =============================================

    validateCNPJ(cnpj: string): boolean {
        const cnpjClean = cnpj.replace(/\D/g, '');

        if (cnpjClean.length !== 14) return false;

        // Verifica CNPJs inválidos conhecidos
        if (/^(\d)\1{13}$/.test(cnpjClean)) return false;

        // Calcula primeiro dígito verificador
        const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
        let sum = 0;
        for (let i = 0; i < 12; i++) {
            sum += parseInt(cnpjClean.charAt(i)) * weights1[i];
        }
        let digit1 = sum % 11;
        digit1 = digit1 < 2 ? 0 : 11 - digit1;

        // Calcula segundo dígito verificador
        const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
        sum = 0;
        for (let i = 0; i < 13; i++) {
            sum += parseInt(cnpjClean.charAt(i)) * weights2[i];
        }
        let digit2 = sum % 11;
        digit2 = digit2 < 2 ? 0 : 11 - digit2;

        return (
            parseInt(cnpjClean.charAt(12)) === digit1 &&
            parseInt(cnpjClean.charAt(13)) === digit2
        );
    }

    formatCNPJ(cnpj: string): string {
        const cnpjClean = cnpj.replace(/\D/g, '');
        if (cnpjClean.length !== 14) return cnpj;
        return cnpjClean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }

    // =============================================
    // Email - Validação
    // =============================================

    validateEmail(email: string): boolean {
        const pattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
        return pattern.test(email);
    }

    // =============================================
    // Telefone Brasileiro - Validação
    // =============================================

    validatePhone(phone: string): boolean {
        const phoneClean = phone.replace(/\D/g, '');
        // Aceita: 10 dígitos (fixo) ou 11 dígitos (celular com 9)
        return phoneClean.length === 10 || phoneClean.length === 11;
    }

    formatPhone(phone: string): string {
        const phoneClean = phone.replace(/\D/g, '');
        if (phoneClean.length === 11) {
            return phoneClean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        } else if (phoneClean.length === 10) {
            return phoneClean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        }
        return phone;
    }

    // =============================================
    // Nome - Validação anti-fake
    // =============================================

    validateName(name: string): { valid: boolean; message?: string } {
        const trimmedName = name.trim();

        // Rejeita nomes muito curtos
        if (trimmedName.length < 3) {
            return { valid: false, message: 'Nome muito curto' };
        }

        // Rejeita nomes sem sobrenome
        const nameParts = trimmedName.split(/\s+/);
        if (nameParts.length < 2) {
            return { valid: false, message: 'Informe nome e sobrenome' };
        }

        // Rejeita caracteres inválidos
        if (/[0-9!@#$%^&*()_+=\[\]{};:"\\|,.<>/?]/.test(trimmedName)) {
            return { valid: false, message: 'Nome contém caracteres inválidos' };
        }

        // Rejeita padrões de teste
        const fakePatterns = /(teste|test|asdf|qwer|xxxx|aaaa|fake|anonimo|anonymous)/i;
        if (fakePatterns.test(trimmedName)) {
            return { valid: false, message: 'Por favor, informe seu nome real' };
        }

        return { valid: true };
    }

    // =============================================
    // Moeda - Formatação
    // =============================================

    formatCurrency(value: number | string): string {
        const numValue = typeof value === 'string' ? parseFloat(value.replace(/\D/g, '')) / 100 : value;
        return numValue.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    }

    parseCurrency(value: string): number {
        return parseFloat(value.replace(/\D/g, '')) / 100;
    }

    // =============================================
    // Data - Formatação
    // =============================================

    formatDate(date: string | Date): string {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleDateString('pt-BR');
    }

    formatDateTime(date: string | Date): string {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleString('pt-BR');
    }
}
