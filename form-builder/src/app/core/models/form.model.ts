// =============================================
// INTERFACES DO FORM BUILDER
// =============================================

export interface Form {
    id: string;
    title: string;
    description?: string;
    slug: string;
    status: 'draft' | 'published' | 'archived';
    settings: FormSettings;
    created_by?: string;
    created_at: string;
    updated_at: string;
}

export interface FormSettings {
    theme?: 'light' | 'dark' | 'institutional';
    primaryColor?: string;
    showLogo?: boolean;
    logoUrl?: string;
    successMessage?: string;
    redirectUrl?: string;
    // Integração Cademí
    cademiEnabled?: boolean;
    cademiProductId?: string;
    cademiProductName?: string;
    cademiToken?: string;
    cademiStatus?: 'aprovado' | 'concluido';
    // Personalização Visual
    backgroundImageUrl?: string;
    backgroundOpacity?: number;
}

export interface FormField {
    id: string;
    form_id: string;
    label: string;
    field_type: FieldType;
    placeholder?: string;
    help_text?: string;
    required: boolean;
    options: FieldOption[];
    validation: FieldValidation;
    field_order: number;
    created_at: string;
    updated_at: string;
}

export type FieldType =
    | 'text'
    | 'email'
    | 'phone'
    | 'cpf'
    | 'cnpj'
    | 'select'
    | 'radio'
    | 'checkbox'
    | 'textarea'
    | 'number'
    | 'date'
    | 'currency'
    | 'file';

export interface FieldOption {
    label: string;
    value: string;
}

export interface FieldValidation {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
    customMessage?: string;
}

export interface FormSubmission {
    id: string;
    form_id: string;
    submitted_at: string;
    ip_address?: string;
    user_agent?: string;
    metadata: Record<string, any>;
}

export interface SubmissionValue {
    id: string;
    submission_id: string;
    field_id: string;
    value?: string;
    created_at: string;
}

// Interface para submissão com valores expandidos
export interface SubmissionWithValues extends FormSubmission {
    values: Record<string, string>; // field_id -> value
}

// Interface para criação de formulário
export interface CreateFormDTO {
    title: string;
    description?: string;
    slug: string;
    status?: 'draft' | 'published' | 'archived';
    settings?: FormSettings;
}

// Interface para criação de campo
export interface CreateFieldDTO {
    form_id: string;
    label: string;
    field_type: FieldType;
    placeholder?: string;
    help_text?: string;
    required?: boolean;
    options?: FieldOption[];
    validation?: FieldValidation;
    field_order?: number;
}

// Interface para submissão de formulário
export interface SubmitFormDTO {
    form_id: string;
    values: Record<string, string>; // field_id -> value
}
