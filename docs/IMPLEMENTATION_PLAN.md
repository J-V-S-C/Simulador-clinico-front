# Arquitetura e decisões do Simulador Clínico

Este documento explica as principais decisões da solução e os limites que ainda precisam de trabalho. Para uma apresentação do produto e instruções de uso, comece pelo [README](../README.md). O caso de uso CSU01 e as regras de negócio estão em `UseCase.md`, no material geral do projeto.

## Visão do funcionamento

O estudante escolhe um caso, acompanha um paciente fictício por tempo limitado, faz perguntas ou propõe condutas e observa as respostas, os sintomas e os sinais vitais. Ao terminar, revê o resultado. O produto também coleta avaliações da experiência e oferece ao administrador uma visão das contas e respostas recebidas.

```text
Estudante → interface Next.js → API FastAPI → regras da simulação → banco SQL
                              ↘ serviço Gemini para fala e avaliação ↗
```

A API decide o tempo, a evolução, as classificações e o resultado. O navegador apresenta os dados recebidos e mostra uma contagem regressiva entre consultas; essa contagem visual é reconciliada com o servidor. Assim, uma alteração local da página não vira um resultado clínico oficial.

## Por que cada parte foi escolhida

| Decisão | Justificativa | Limite ou cuidado |
| --- | --- | --- |
| Next.js com React e TypeScript | Organiza páginas e componentes reutilizáveis e verifica os contratos de dados em desenvolvimento. | O frontend depende da API para carregar casos e ações. |
| FastAPI com Pydantic | Expõe uma API JSON documentada e valida entrada e saída. | Erros devem ter mensagens compreensíveis na interface. |
| Regras em `models/` e casos de uso em `services/` | Separa a lógica do atendimento da rota HTTP, permitindo testes sem navegador. | O resultado deve sempre passar pelas regras do servidor. |
| Interfaces em `ports/` | Permitem trocar relógio, avaliador e armazenamento nos testes. | Os testes com avaliador falso não comprovam o comportamento do Gemini real. |
| SQLAlchemy e Alembic | Persistem tentativas, contas e feedbacks e registram mudanças do esquema. | Migrações precisam acompanhar toda publicação do backend. |
| SQLite na VPS atual | Simples para uma única instância e volume moderado, com arquivo em disco persistente. | Escritas concorrentes são serializadas; múltiplas instâncias ou tráfego alto podem exigir PostgreSQL. |
| Gemini via SDK oficial no backend | Torna a conversa mais flexível e auxilia na avaliação do texto livre. | A saída é validada antes de modificar o estado clínico; falhas retornam erro recuperável. |
| Respostas parciais por eventos | O estudante acompanha a geração da fala do paciente. | A prévia não é tratada como resposta final até a API validá-la e salvá-la. |
| Vercel para a interface; Oracle para a API | Mantém publicação da interface separada do banco e dos segredos do servidor. | É preciso configurar HTTPS, `API_BASE_URL` e `ALLOWED_ORIGINS` corretamente. |
| Sessões separadas para estudantes e administrador | O estudante acessa apenas as próprias tentativas; a administração consulta contas e avaliações. | A senha administrativa fica apenas no ambiente do backend e não deve aparecer no repositório. |
| `localStorage` apenas para preferências | Lembra duração, intervalo de avanço e leitura do guia inicial. | Não armazena resultados clínicos nem segredo da IA. |

## Caminho de uma ação

1. O estudante escreve no chat e escolhe um sintoma visível.
2. O frontend envia o texto e o identificador da tentativa à API com a sessão do estudante.
3. A API verifica o dono da tentativa, o estado do caso e as regras de entrada.
4. O backend usa o estado e o histórico para obter a resposta do Gemini, valida a saída, atualiza tempo e quadro e salva no banco.
5. A interface recebe o estado salvo e atualiza conversa, sinais e resultado. Se ocorrer erro, preserva o texto digitado para nova tentativa.

As rotas são definidas em `backend/routes/api.py`. Cadastro e sessão usam `/auth`; casos usam `/cases`; simulações, protocolos, relatórios de resposta e avaliações usam `/simulations`; a consulta administrativa usa `/admin`. A documentação interativa da API fica em `/docs`.

## Decisões de experiência e acessibilidade

- A interface usa textos em português, hierarquia visual clara e cores de estado acompanhadas de números e rótulos. Os detalhes estão em [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md).
- O cronômetro permanece visível na tela de simulação, e a evolução recente informa mudanças observadas após ações ou passagem de tempo.
- O chat tem mais espaço para leitura e digitação em desktop e celular. Antes da primeira tentativa, um guia curto explica a sequência; dentro do chat vazio, uma instrução indica a próxima ação. O guia é reaberto pelo painel.
- Protocolos são consultados no próprio chat em três níveis. O resultado apresenta as fontes consultadas.
- O envio por Enter e a quebra de linha por Shift+Enter são indicados perto do campo. Estados de carregamento, erro, ausência de dados, confirmação e sessão expirada têm mensagens próprias.
- A animação decorativa respeita a preferência de movimento reduzido. Os valores clínicos vêm da API; a ilustração não substitui os números.

## Relação com o Challenge

| Exigência | Onde está atendida ou registrada |
| --- | --- |
| Interface navegável, responsiva e integrada | Páginas em `app/`, componentes em `src/` e evidências históricas em [VALIDATION.md](VALIDATION.md). |
| Frontend envia → Python processa e salva → frontend mostra | Rotas da API, persistência SQL e testes de integração locais registrados em [VALIDATION.md](VALIDATION.md). |
| Uso de `localStorage` | Preferências de duração e avanço, além do estado do guia inicial. |
| Feedback e melhorias | Avaliação após a tentativa, painel administrativo e tabela de alterações no [README](../README.md). |
| Teste de usabilidade com pelo menos três participantes | [USABILITY_STUDY.md](USABILITY_STUDY.md) contém o roteiro; ainda precisa de preenchimento com observações reais da equipe. |
| Tecnologias, execução, links, equipe e IA | [README](../README.md) e [INTEGRANTES.TXT](../INTEGRANTES.TXT). |

## Limites e próximos passos verificáveis

- Executar e registrar o teste observado com pelo menos três participantes, sem confundi-lo com os três feedbacks espontâneos já coletados. Medir se o guia e o chat ampliado melhoraram a compreensão.
- Revisar a versão atual da sala no navegador em larguras de desktop e celular; as capturas de outubro mostram versões anteriores. Verificar teclado, foco, contraste e preferência de movimento reduzido.
- Testar a publicação pública de ponta a ponta com Gemini real, inclusive falha de rede, tempo esgotado naturalmente e agravamento crítico. Os testes locais com avaliador falso não demonstram essas condições.
- Evoluir o fluxo de sintomas ocultos ou complexos com exames e regras específicas quando fizer parte do escopo aprovado. O resultado ainda não possui uma linha do tempo clínica persistida completa.
- Fazer revisão clínica dos protocolos antes de qualquer uso institucional e aplicar limites de requisições para proteger a API e a cota de IA.
