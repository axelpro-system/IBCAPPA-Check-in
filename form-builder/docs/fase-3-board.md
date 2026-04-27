# Fase 3 - Board de Execucao (4-8 semanas)

## Legenda
- `P0`: critico para liberar valor de negocio e reduzir risco tecnico
- `P1`: importante para escala e governanca
- `P2`: melhoria relevante, mas nao bloqueante

## To Do

### Sprint 1 - Fundacao
- [ ] `US-301` `P0` Modelo de eventos de analytics
  - Pontos: `5`
  - Aceite: tabelas `form_events` + indices + versao de schema dos eventos.

- [ ] `US-302` `P0` Instrumentacao frontend de eventos
  - Pontos: `8`
  - Aceite: envio de `view_form`, `start_form`, `field_focus`, `field_change`, `field_blur`, `submit_success`, `submit_error`.

- [ ] `US-303` `P0` Auditoria base de acoes admin
  - Pontos: `8`
  - Aceite: loga create/update/delete/publish/export com `user_id`, entidade, `before/after`, `timestamp`.

- [ ] `US-304` `P0` RLS inicial das tabelas novas
  - Pontos: `5`
  - Aceite: bloqueio cross-tenant validado por teste.

### Sprint 2 - Analytics de produto
- [ ] `US-305` `P0` Funil por formulario/pagina
  - Pontos: `8`
  - Aceite: painel com `visitas > inicios > envios`, filtro por periodo e formulario.

- [ ] `US-306` `P0` Abandono por campo
  - Pontos: `8`
  - Aceite: ranking de campos com maior abandono + tempo medio por campo.

- [ ] `US-307` `P1` Alertas de queda de conversao
  - Pontos: `5`
  - Aceite: regra configuravel (ex.: queda >20% em 24h) + notificacao.

- [ ] `US-308` `P1` Export de analytics (CSV)
  - Pontos: `3`
  - Aceite: exporta dados filtrados do painel.

### Sprint 3 - A/B test
- [ ] `US-309` `P0` Entidades de experimento e variantes
  - Pontos: `8`
  - Aceite: CRUD com status `draft/running/paused/finished`.

- [ ] `US-310` `P0` Randomizacao persistente por visitante
  - Pontos: `5`
  - Aceite: visitante mantem variante em sessoes futuras.

- [ ] `US-311` `P0` Metricas por variante
  - Pontos: `8`
  - Aceite: conversao, abandono e tempo por variante.

- [ ] `US-312` `P1` Regra de encerramento de experimento
  - Pontos: `5`
  - Aceite: amostra minima e nivel de confianca exibido.

### Sprint 4 - Biblioteca e seguranca
- [ ] `US-313` `P1` Biblioteca de blocos reutilizaveis
  - Pontos: `8`
  - Aceite: criar/editar/publicar bloco e inserir no editor com 1 clique.

- [ ] `US-314` `P1` Versionamento de blocos
  - Pontos: `5`
  - Aceite: formularios antigos nao quebram ao publicar nova versao.

- [ ] `US-315` `P0` Retencao de dados por workspace
  - Pontos: `8`
  - Aceite: politica configuravel + job de expurgo auditavel.

- [ ] `US-316` `P0` Compliance + hardening enterprise
  - Pontos: `13`
  - Aceite: trilha imutavel em acoes criticas, rate limit, documentacao LGPD operacional.

## In Progress
- [ ] (vazio)

## Done
- [ ] (vazio)

## Ordem recomendada de execucao (P0 primeiro)
1. `US-301`
2. `US-302`
3. `US-303`
4. `US-304`
5. `US-305`
6. `US-306`
7. `US-309`
8. `US-310`
9. `US-311`
10. `US-315`
11. `US-316`
12. `US-307`
13. `US-308`
14. `US-312`
15. `US-313`
16. `US-314`

## KPIs da fase
- Conversao media por formulario: alvo `+10%`
- Reducao de abandono nos 3 piores campos: alvo `-20%`
- Tempo para montar novo formulario com blocos: alvo `-30%`
- Cobertura de auditoria em acoes criticas: alvo `100%`

## Definition of Done (global)
- Testes automatizados cobrindo sucesso e permissoes negadas.
- Telemetria sem erro de schema no ambiente produtivo.
- RLS validada com teste de isolamento entre workspaces.
- Documentacao tecnica e operacional atualizada.
