import { CreateFormDTO, CreateFieldDTO } from '../models/form.model';

export interface FormTemplate {
    id: string;
    name: string;
    description: string;
    icon: string;
    form: CreateFormDTO;
    fields: Omit<CreateFieldDTO, 'form_id'>[];
}

export const FORM_TEMPLATES: FormTemplate[] = [
    {
        id: 'aula-feedback',
        name: 'Avaliação de Aula',
        description: 'Colete feedback sobre a qualidade didática e conteúdo das suas aulas.',
        icon: 'bi-star-fill',
        form: {
            title: 'Avaliação da Aula',
            description: 'Sua opinião é fundamental para melhorarmos nosso conteúdo.',
            slug: 'avaliacao-aula',
            status: 'published',
            settings: {
                theme: 'institutional',
                primaryColor: '#2563eb',
                successMessage: 'Obrigado pelo seu feedback!'
            }
        },
        fields: [
            {
                label: 'Em uma escala de 0 a 10, o quanto você recomendaria esta aula para um colega?',
                field_type: 'nps',
                required: true,
                help_text: 'Em que 0 é “não recomendaria de jeito nenhum” e 10 “recomendaria com certeza”.',
                field_order: 0
            },
            {
                label: 'Como você avalia a clareza da explicação e a relevância do conteúdo da aula?',
                field_type: 'select',
                required: true,
                options: [
                    { label: '⭐ (Muito ruim)', value: '1' },
                    { label: '⭐⭐ (Regular)', value: '2' },
                    { label: '⭐⭐⭐ (Bom)', value: '3' },
                    { label: '⭐⭐⭐⭐ (Muito bom)', value: '4' },
                    { label: '⭐⭐⭐⭐⭐ (Excelente)', value: '5' }
                ],
                field_order: 1
            },
            {
                label: 'O que mais gostou na aula?',
                field_type: 'textarea',
                required: false,
                field_order: 2
            },
            {
                label: 'Tem algum ponto que não ficou claro ou algo que possamos melhorar para a próxima?',
                field_type: 'textarea',
                required: false,
                field_order: 3
            }
        ]
    },
    {
        id: 'indicacao-feedback',
        name: 'Indicação de Novas Aulas',
        description: 'Pesquisa para sugestão de temas, cursos e novos professores.',
        icon: 'bi-lightbulb-fill',
        form: {
            title: '[PESQUISA] INDICAÇÃO DE NOVAS AULAS',
            description: '✨ Ajude a Construir o Futuro da Educação no IBCAPPA! No IBCAPPA, acreditamos que a melhor forma de crescer é ouvindo quem mais importa: você.',
            slug: 'indicacao-aulas',
            status: 'published',
            settings: {
                theme: 'institutional',
                primaryColor: '#2563eb',
                successMessage: 'Obrigado por ajudar a construir o IBCAPPA!'
            }
        },
        fields: [
            {
                label: 'E-mail',
                field_type: 'email',
                required: true,
                help_text: 'Deixe seu e-mail para receber um agradecimento caso sua ideia seja aprovada.',
                field_order: 0
            },
            {
                label: 'Qual tema você gostaria que fosse abordado em uma nova aula ou curso?',
                field_type: 'textarea',
                required: true,
                field_order: 1
            },
            {
                label: 'Esse tema se encaixa melhor em qual formato?',
                field_type: 'select',
                required: true,
                options: [
                    { label: 'Curso completo (mais de 10 horas)', value: 'completo' },
                    { label: 'Curso rápido (menos de 10 horas)', value: 'rapido' },
                    { label: 'Aula isolada (1h a 2h)', value: 'isolada' },
                    { label: 'Live ou webinário', value: 'live' },
                    { label: 'Outro', value: 'outro' }
                ],
                field_order: 2
            },
            {
                label: 'Por que esse tema é importante para você ou para sua atuação profissional?',
                field_type: 'textarea',
                required: true,
                field_order: 3
            },
            {
                label: 'Você gostaria de indicar algum professor ou profissional para ministrar aulas no IBCAPPA?',
                field_type: 'textarea',
                required: true,
                help_text: 'Indique nome, telefone ou redes sociais.',
                field_order: 4
            },
            {
                label: 'Você já viu esse profissional em alguma aula, palestra, rede social ou curso? Onde?',
                field_type: 'textarea',
                required: true,
                field_order: 5
            },
            {
                label: 'O que te chamou atenção no conteúdo ou didática desse professor?',
                field_type: 'textarea',
                required: true,
                field_order: 6
            },
            {
                label: 'Deseja deixar mais alguma sugestão, ideia ou feedback para o IBCAPPA?',
                field_type: 'textarea',
                required: true,
                field_order: 7
            }
        ]
    }
];
