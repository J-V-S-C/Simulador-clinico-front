# Simulador Clínico

Projeto educacional do Challenge FIAP em parceria com o Hospital Moinhos de Vento. O Simulador Clínico permite que estudantes pratiquem decisões em atendimentos fictícios, com tempo limitado, conversa com um paciente virtual e alterações no quadro clínico ao longo da tentativa. **Ele não atende pacientes reais nem substitui avaliação médica ou protocolos locais.**

**Aplicação:** [simulador-clinico-front.vercel.app](https://simulador-clinico-front.vercel.app) (endereço informado pela equipe; disponibilidade não verificada nesta revisão)

**Código da interface:** [GitHub — frontend](https://github.com/J-V-S-C/Simulador-clinico-front)

**Código da API:** [GitHub — backend](https://github.com/J-V-S-C/simulador-critico-backend)

**Equipe e RM:** [INTEGRANTES.TXT](INTEGRANTES.TXT)

## O problema e a proposta

Estudar um caso clínico apenas pela leitura não permite experimentar a sequência de decisões de um atendimento: observar sinais, fazer perguntas, agir, perceber mudanças e lidar com o tempo. O projeto oferece um ambiente de treino para esse percurso. O estudante pode repetir casos e analisar o resultado sem expor pacientes reais. O foco é **praticar raciocínio e condutas em uma simulação didática**, não emitir diagnóstico ou recomendação para uso clínico.

A Sprint 3 entregou a experiência visual navegável. Na Sprint 4, a interface foi integrada a uma API em Python, que processa e salva as tentativas. O projeto também passou a coletar avaliações dos estudantes, usadas para orientar melhorias. Os registros técnicos e as evidências estão em [docs/VALIDATION.md](docs/VALIDATION.md); o modelo para a validação de usabilidade exigida pelo Challenge está em [docs/USABILITY_STUDY.md](docs/USABILITY_STUDY.md).

## Como usar

1. O estudante cria uma conta ou entra com a conta existente. Para experimentar, pode cadastrar um e-mail fictício em formato válido e uma senha própria. Não há confirmação de e-mail nem recuperação automática de senha.
2. No painel, escolhe um caso e sua duração. Antes da primeira tentativa, aparece um guia curto; ele pode ser reaberto por **Como funciona?**.
3. Durante o atendimento, observa os sinais vitais e sintomas, pergunta ao paciente ou descreve uma conduta no chat. Pode consultar os três níveis de orientação do protocolo, avançar o tempo e denunciar uma resposta incoerente.
4. A cada ação, o sistema atualiza o paciente e o tempo. A tentativa termina quando o estudante conclui, o tempo se esgota, ocorre agravamento crítico ou todas as queixas previstas são abordadas.
5. No resultado, o estudante revê o desfecho e suas interações. Pode avaliar a experiência e editar a avaliação depois, na aba **Feedbacks** do painel.

Há um acesso administrativo separado em `/admin/entrar` para consultar contas e avaliações enviadas. Suas credenciais são definidas exclusivamente no ambiente do backend e **não devem ser publicadas no README**.

## O que a aplicação entrega hoje

| Área | Funcionalidade |
| --- | --- |
| Conta | Cadastro, login, sessão temporária e histórico individual. |
| Simulação | Casos fictícios, sintomas, sinais vitais, relógio, conversa textual, protocolos, evolução e resultado. |
| Aprendizado | Guia inicial, explicação do próximo passo, retorno sobre as condutas e referências públicas do NHS nos protocolos. |
| Qualidade | Denúncia de respostas da IA e avaliação da experiência, com notas e comentários. |
| Administração | Consulta das contas cadastradas e de todos os feedbacks, com sessão própria. |

A simulação usa simplificações para ensinar. A melhora imediata de indicadores no encerramento representa o resultado do exercício; não descreve a recuperação de uma pessoa real. Casos ocultos e complexos ainda não têm um fluxo completo de exames ou máquinas. As referências do NHS são resumos didáticos e precisam de revisão clínica antes de qualquer uso institucional.

## Tecnologias e decisões

| Escolha | Motivo e consequência prática |
| --- | --- |
| **Next.js 16, React 19 e TypeScript** | Organizam as telas em componentes e rotas, permitem compartilhar tipos da API e detectar erros de código antes da publicação. O projeto usa o App Router do Next.js. |
| **Tailwind CSS 4 e CSS do projeto** | Tailwind fornece os tokens de cor e utilidades; estilos próprios mantêm os padrões repetidos, a sala ilustrada e o layout responsivo. As regras visuais estão em [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md). |
| **FastAPI em Python** | Recebe as ações, valida entradas, executa as regras da simulação e devolve o estado atualizado. O navegador nunca decide o desfecho clínico. Consulte o [README da API](https://github.com/J-V-S-C/simulador-critico-backend#readme). |
| **SQLAlchemy, Alembic e SQLite** | Persistem contas, tentativas e feedbacks; migrações permitem evoluir o esquema. SQLite atende à instalação atual em uma única VPS com disco persistente. O banco pode ser configurado por `DATABASE_URL`. |
| **Gemini no servidor** | Gera a fala do paciente e ajuda a avaliar o texto enviado. O backend valida a resposta antes de alterar o estado clínico; regras determinísticas controlam tempo, transições e encerramento. A chave da IA nunca vai para o navegador. |
| **Vercel para a interface e VPS Oracle para a API** | A interface é publicada separadamente do servidor que guarda dados e segredos. `API_BASE_URL` liga as duas partes; `ALLOWED_ORIGINS` restringe quais origens podem chamar a API pelo navegador. |
| **`sessionStorage` e `localStorage`** | A sessão de acesso fica na aba do navegador. Preferências não clínicas, como duração escolhida e guia já visto, ficam em `localStorage`. Resultados clínicos permanecem no backend. |

O fluxo integrado é: **navegador envia ação → API valida e processa → banco salva → API devolve o novo estado → navegador apresenta o resultado**. A resposta parcial do paciente aparece por transmissão de eventos enquanto é gerada; a interface só considera definitiva a resposta validada e salva. Se a IA falhar, o texto digitado é preservado para nova tentativa. As decisões de arquitetura e seus limites estão detalhados em [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md).

## Executar no computador

Requisitos: Node.js 20.9 ou superior, npm e o backend Python. Na pasta do frontend:

```bash
npm install
cp .env.example .env.local
npm run dev
```

Em `.env.local`, configure `API_BASE_URL=http://127.0.0.1:8000/api` para usar a API local. Inicie o backend conforme o [README do repositório da API](https://github.com/J-V-S-C/simulador-critico-backend#executar-localmente) e abra `http://127.0.0.1:3000`. Para verificar o código e gerar a versão de produção:

```bash
npm run typecheck
npm run build
npm run start
```

O frontend não contém a chave Gemini nem a senha administrativa. A configuração de produção da Vercel deve apontar `API_BASE_URL` para a API HTTPS; mudar essa variável exige uma nova publicação da interface. O backend precisa permitir a origem exata do frontend em `ALLOWED_ORIGINS`.

## Validação, feedback e melhorias

O requisito da Sprint 4 separa **avaliações enviadas no produto** de **teste de usabilidade observado com pelo menos três participantes**. O painel administrativo mostrou 12 contas e 3 avaliações em 30/10/2026, conforme os dados apresentados pelo responsável pelo projeto. Esses números mudam com o uso; nomes e e-mails não são reproduzidos aqui. Três avaliações não comprovam, por si só, a realização do teste observado exigido pelo Challenge. O roteiro e os campos para registrar participantes, tarefas e evidências estão em [docs/USABILITY_STUDY.md](docs/USABILITY_STUDY.md).

| Avaliação anônima | O que foi relatado | Ajuste realizado |
| --- | --- | --- |
| F1 | Experiência negativa; clareza 1/5 e dificuldade 1/5; sem comentário livre. | Guia de três passos antes da primeira tentativa, com acesso posterior por **Como funciona?**. Explica observação, conversa, conduta, protocolo, tempo e resultado. |
| F2 | Experiência negativa; clareza 3/5 e dificuldade 3/5; sem comentário livre. | Instrução no chat vazio para indicar a primeira ação dentro da própria simulação. |
| F3 | Experiência positiva; clareza 2/5 e dificuldade 2/5. Elogiou os protocolos e pediu tutorial, explicações mais didáticas e chat maior. | Guia inicial, manutenção do acesso aos protocolos no chat, ampliação da conversa e do campo de texto em desktop e celular. |

O guia aparece **antes** da criação da tentativa, para que sua leitura não consuma o tempo do caso. As alterações respondem aos relatos recebidos; sua eficácia ainda precisa ser medida em uma nova rodada com usuários. Consulte [docs/VALIDATION.md](docs/VALIDATION.md) para os testes técnicos e capturas de tela já registrados, observando que imagens antigas mostram versões anteriores da interface.

## Publicação e acesso para avaliação

- **Frontend:** [abrir a aplicação na Vercel](https://simulador-clinico-front.vercel.app).
- **API:** [documentação interativa](https://clinical-simulator-api.duckdns.org/docs) e [verificação de saúde](https://clinical-simulator-api.duckdns.org/api/health), endereços registrados no repositório do backend. A disponibilidade pública não foi confirmada nesta revisão.
- **Conta de teste do estudante:** o avaliador pode criar uma conta pela tela `/entrar`; use dados fictícios. Não há uma senha compartilhada publicada.
- **Administração:** `/admin/entrar` exige credenciais fornecidas à banca separadamente pelo responsável. Nunca inclua a senha administrativa no Git.
- **Protótipo no Figma:** nenhum link foi identificado no repositório; incluir aqui se a equipe tiver um protótipo utilizado na entrega.

A API deve permanecer em HTTPS, com banco persistente, chaves privadas apenas no servidor e backup do banco. O [guia de implantação da API](https://github.com/J-V-S-C/simulador-critico-backend/blob/main/DEPLOY_ORACLE_VERCEL.md) descreve a instalação na Oracle e a ligação com a Vercel.

## Organização do repositório

| Caminho | Conteúdo |
| --- | --- |
| `app/` | Rotas Next.js: entrada, painel, simulação, resultado e administração. |
| `src/screens/` | Telas principais e seus estados de carregamento, erro e sucesso. |
| `src/components/` | Componentes reutilizados, como cena do paciente, indicadores e avaliação. |
| `src/hooks/useSimulation.ts` | Atualização periódica da simulação e do relógio apresentado. |
| `src/api.ts`, `src/auth.tsx`, `src/types.ts` | Comunicação com API, sessão do estudante e contratos de dados. |
| `src/styles.css`, `src/immersion.css`, `src/scene.css` | Estilos gerais, sala de atendimento e arte. |
| `docs/`, `assets/` | Evidências, planejamento e recursos visuais. |

## Uso de inteligência artificial no desenvolvimento

A aplicação usa Gemini **durante a simulação** para produzir respostas do paciente virtual e auxiliar na avaliação de interações. A equipe também usou assistência de IA durante o desenvolvimento para apoiar estruturação de código, integração e documentação. O estado clínico e o encerramento são decididos pelo backend após validação, e o uso de IA não substitui revisão das regras clínicas e dos textos didáticos.
