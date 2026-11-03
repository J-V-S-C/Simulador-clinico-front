# Sistema visual do Simulador Clínico

O desenho da interface ajuda o estudante a localizar o que precisa observar e decidir. O painel apresenta os casos primeiro; durante o atendimento, o relógio, o paciente, a conversa, os sinais vitais e os sintomas formam uma sequência de leitura. O diagnóstico fica reservado até o fim do caso.

## Cores e uso

| Elemento | Valor | Aplicação |
| --- | --- | --- |
| Azul escuro | `#193655` | Títulos, ações principais e informações de tempo. |
| Azul | `#005bbf` | Links, foco e orientações. |
| Magenta | `#ed145b` | Alerta ou estado crítico, acompanhado de texto. |
| Azul claro | `#e9f3fc` | Superfícies informativas discretas. |
| Verde | `#527669` | Melhora e estado estável. |
| Fundo claro | `#f5f7fa` | Fundo das páginas. |

A interface usa fontes sem serifa do sistema para facilitar a leitura em computadores e celulares. Cartões, resultados e formulários têm superfícies claras e bordas finas. A cor nunca deve ser a única forma de comunicar uma condição: sintomas mostram também intensidade e nome do estado; sinais vitais exibem valores e unidades.

## Organização das telas

- **Painel:** apresentação, casos disponíveis, fontes dos protocolos, histórico e avaliações do estudante. O link **Como funciona?** reabre o guia. Antes da primeira tentativa, o guia explica três etapas sem consumir o tempo do caso.
- **Simulação:** a sala ilustrada e o chat ficam no centro; relógio e encerramento aparecem acima. Sinais vitais, sintomas e evolução acompanham o caso ao redor da sala. O chat contém conversa, consulta de protocolos, avanço de tempo e denúncia de resposta.
- **Resultado:** reúne desfecho, evolução, interações e convite para avaliar a experiência.
- **Administração:** tela separada para consultar contas e avaliações, protegida por sessão própria.

Em celulares, as áreas se reorganizam em uma coluna e mantêm controles e texto legíveis. O chat foi ampliado depois de feedback dos estudantes, incluindo a área de respostas e o campo de digitação. Os botões precisam ter estado de foco visível e tamanho adequado para toque. As animações decorativas respeitam a preferência por movimento reduzido.

## Componentes e estados

Componentes reutilizados incluem botões, cartões, rótulos de seção, indicadores, mensagens de erro, painéis de feedback e campos de formulário. A interface apresenta estados de carregamento, ausência de dados, sucesso, falha de conexão, sessão expirada, confirmação de encerramento e caso concluído. O texto deve explicar a ação possível em cada estado.

A sala usa a folha de pixel art fornecida ao projeto e um paciente derivado em três poses. A pose muda conforme a gravidade informada pela API. Ilustração e animação ajudam a perceber o contexto, mas **os valores clínicos oficiais são os números e estados devolvidos pelo servidor**. Os protocolos resumidos contêm links para suas fontes públicas.

## Validação visual

As mudanças na interface orientadas pelas avaliações dos estudantes estão registradas em [MELHORIAS_FEEDBACK.md](MELHORIAS_FEEDBACK.md).
