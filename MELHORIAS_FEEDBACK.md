# Front-End Design e Web Development — melhorias a partir das avaliações

## Produto e origem dos dados

O Simulador Clínico é um MVP web para estudantes praticarem atendimentos fictícios. O estudante escolhe um caso, observa sinais e sintomas, conversa com um paciente virtual, consulta orientações e recebe o resultado. A interface em Next.js/React consome a API Python, que processa as ações e salva as tentativas e avaliações.

Os dados abaixo vêm do conteúdo do painel administrativo fornecido pela equipe em 03/11/2026. O painel mostrava **47 contas cadastradas e 54 avaliações enviadas** após atendimentos no produto. São registros de uso real da aplicação. Uma pessoa pode avaliar mais de uma tentativa; por isso o número de avaliações não é uma contagem de pessoas distintas. Este documento apresenta apenas resultados agregados e comentários resumidos, sem nomes, e-mails ou identificadores das tentativas.

## Resultados das 54 avaliações

| Indicador | Resultado |
| --- | ---: |
| Gostaram da experiência | 27 de 54 (50%) |
| Responderam que a experiência pode melhorar | 27 de 54 (50%) |
| Clareza média, escala de 1 a 5 | 2,93 |
| Dificuldade média, escala de 1 a 5 (5 = mais difícil) | 3,09 |
| Escreveram sugestão de melhoria | 27 de 54 (50%) |

As médias são descritivas das avaliações exibidas naquele momento. O formulário é opcional e cada resposta se refere a uma tentativa, não a uma pessoa única. Os comentários permitem identificar problemas concretos: orientação inicial insuficiente, dúvidas sobre como conversar e propor condutas, respostas do paciente que parecem travar o progresso, dificuldade para localizar sinais vitais e protocolos considerados vagos em alguns casos. Também há elogios aos protocolos, ao tutorial, ao temporizador e às respostas do paciente.

## Mudanças orientadas pelo feedback

| O que os estudantes relataram | Mudança implementada | Onde conferir |
| --- | --- | --- |
| Pedidos de tutorial, mais didática e explicação de como começar. | O painel exibe **Ver como funciona** e um guia de quatro passos sobre sintoma, chat, protocolo e evolução. O guia é mostrado antes de criar a primeira tentativa e pode ser reaberto. | `src/screens/DashboardPage.tsx`, `src/styles.css` |
| Dificuldade para iniciar a conversa e saber qual ação tomar. | O chat vazio passou a orientar a leitura do quadro, a pergunta ao paciente e a descrição de uma conduta. | `src/screens/SimulationPage.tsx` |
| Pedido de maior espaço para ler a conversa e digitar. | A área de mensagens e o campo de composição foram ampliados nos layouts de desktop e celular. | `src/styles.css`, `src/immersion.css` |
| Condutas corretas descritas com outras palavras pareciam não fazer o caso progredir. | A API passou a avaliar grupos de ações essenciais e sinônimos em vez de exigir a frase exata de referência. A interface explica essa regra no guia. | `backend/services/simulations.py` no repositório da API; `src/screens/DashboardPage.tsx` |
| Protocolos úteis, porém pouco específicos ou repetitivos em alguns casos. | O conteúdo didático foi organizado por sintoma e em três níveis progressivos; a interface mostra o protocolo do sintoma selecionado e sua fonte. | `backend/sample_data.py` no repositório da API; `src/screens/SimulationPage.tsx` |

Essas mudanças respondem a problemas apontados pelos usuários. As avaliações exibidas misturam tentativas anteriores e posteriores a algumas mudanças; portanto, os indicadores acima não medem isoladamente o efeito de cada alteração.

## Pontos ainda levantados pelos usuários

Comentários recentes pedem respostas do paciente mais diretas e confiáveis, mais casos, fontes clínicas mais completas, identificação mais clara do paciente e sinais vitais mais visíveis. Esses pedidos servem para priorizar a próxima versão; este documento não os apresenta como funcionalidades concluídas.

## Entrega integrada

Front-End Design e Web Development compõem a mesma aplicação publicada. A interface usa componentes React, rotas públicas e protegidas, um hook customizado em `src/hooks/useSimulation.ts`, Tailwind CSS e estilos responsivos. O README principal traz os endereços do código e do deploy, a configuração da API e as instruções para executar a aplicação. As avaliações são enviadas pela interface, persistidas na API e consultadas no painel administrativo; assim, as decisões de interface acima usam dados gerados pelo próprio produto.
