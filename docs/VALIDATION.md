# Evidências de funcionamento e validação

Este documento separa o que foi observado em testes locais, o que foi verificado por comandos e o que ainda depende de confirmação. As capturas em `docs/evidence/` são **históricas**: mostram versões da interface feitas em outubro de 2026 e não comprovam, sozinhas, o layout atual com guia e chat ampliado.

## Percurso integrado verificado localmente

Em 21/10/2026, um navegador com Chromium sem interface gráfica foi usado com a API FastAPI, um banco SQLite temporário e um avaliador falso que devolve respostas previsíveis. O teste percorreu cadastro, login, escolha de caso, início de simulação, envio de interação, exibição de resposta salva, consulta de protocolo, denúncia de resposta, conclusão, resultado e recarregamento. Uma falha simulada de envio mostrou erro e permitiu tentar novamente. O navegador não registrou erros de página nesse percurso. Exemplos de captura: [painel desktop](evidence/dashboard-desktop.png) e [simulação celular](evidence/simulation-mobile.png).

Em uma segunda passagem local, o teste mostrou que um token revogado leva de volta à entrada e informa a expiração da sessão. O resultado e a simulação terminada foram reabertos sem perder a interação e o protocolo revelado. Uma captura do resultado em celular está em [resultado mobile](evidence/result-mobile-2026-10-21.png). Esses testes usaram dados fictícios e **não** chamaram o Gemini real.

## Evolução visual registrada em 22/10/2026

A equipe revisou a sala e o paciente em várias etapas. As capturas abaixo preservam essa evolução; layouts intermediários foram substituídos depois.

| Etapa | Evidência registrada | Limite da evidência |
| --- | --- | --- |
| Simulação com pressão de tempo e evolução do quadro | [resultado após avanço de tempo](evidence/pressure-result-mobile-2026-10-22.png) | O tempo foi avançado por ação; não verifica um minuto inteiro de espera natural. |
| Nova cena e adaptação para celular | [desktop](evidence/new-scene-desktop-2026-10-22.png) e [celular](evidence/new-scene-mobile-2026-10-22.png) | Cena anterior à folha de pixel art atual. |
| Aplicação da folha de pixel art fornecida | [desktop](evidence/new-atlas-desktop-2026-10-22.png) e [celular](evidence/new-atlas-mobile-2026-10-22.png) | Confirmação visual local da arte naquele estágio. |
| Sala ilustrada e chat em atendimento | [desktop](evidence/immersive-desktop-2026-10-22.png) e [celular](evidence/immersive-mobile-2026-10-22.png) | Revisão anterior da disposição dos painéis. |
| Sala enquadrada e paciente animado | [desktop](evidence/framed-desktop-2026-10-22.png) e [celular](evidence/framed-mobile-2026-10-22.png) | Antes da revisão final da moldura e dos indicadores. |
| Indicadores, paciente e relógio | [desktop](evidence/ui-review-wide-adjusted-2026-10-22.png) e [celular](evidence/ui-review-mobile-2026-10-22.png) | Sem erro no console nesse teste; não representa o guia e chat ampliado. |
| Termômetro e protocolo no chat | [desktop](evidence/thermometer-desktop-2026-10-22.png), [simulação celular](evidence/thermometer-mobile-final-2026-10-22.png) e [protocolo celular](evidence/protocol-mobile-final-2026-10-22.png) | Versão anterior às melhorias orientadas pelos feedbacks de 30/10. |

Na passagem local de 22/10, o estudante conseguiu revelar o primeiro nível do protocolo, perguntar ao paciente, receber a resposta salva, denunciar a resposta, concluir a tentativa e consultar o resultado. Em 375 px de largura, as telas então testadas não apresentaram rolagem horizontal. Os testes locais usam banco temporário e avaliador falso, portanto não comprovam disponibilidade pública ou comportamento de IA real.

## Feedback recebido e mudanças

Em 30/10/2026, o responsável pelo projeto apresentou o painel administrativo com 12 contas e 3 avaliações enviadas. A síntese anônima de cada resposta e a mudança correspondente estão no [README](../README.md). Foram adicionados um guia antes da primeira tentativa, instruções no chat vazio e mais espaço para conversa e digitação em desktop e celular. A leitura do guia ocorre antes da criação da simulação. **Ainda não há captura ou teste observado com usuários para verificar a eficácia dessas alterações.**

## Verificações técnicas desta revisão

- `npm run typecheck`: passou após as mudanças no guia e no chat.
- `npm run build`: interrompido no ambiente local por erro do Next.js ao interpretar a saída de `TypeScript --showConfig`; o comando `tsc --noEmit` passou. Este resultado não comprova falha nem sucesso da compilação na Vercel.
- A suíte do backend tinha 68 testes aprovados na última execução registrada durante o desenvolvimento do acesso administrativo. Esse número não substitui nova execução na versão de entrega.

## Pendências para a entrega

1. Verificar a versão publicada do frontend e da API em navegador real, incluindo cadastro, conversa com Gemini, protocolo, resultado, feedback e administração. Os endereços estão no [README](../README.md); sua disponibilidade pública não foi confirmada nesta revisão.
2. Repetir a checagem visual da versão atual em desktop e celular, inclusive teclado, foco e movimento reduzido. Salvar capturas novas que mostrem o guia e o chat ampliado.
3. Realizar a validação observada com pelo menos três participantes representativos, registrando tarefas, dificuldades, comentários e melhorias em [USABILITY_STUDY.md](USABILITY_STUDY.md). Três respostas de feedback coletadas pelo produto não equivalem a essa observação.
4. Testar o tempo esgotado por espera real, o agravamento crítico e a recuperação após falhas de rede ou respostas `409` e `503`.
