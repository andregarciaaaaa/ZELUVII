# Mapeamento de dados pessoais no Zeluvi

Lei nº 13.709/2018 (LGPD)
André Lucas Garcia

## Do que se trata este documento

O Zeluvi é um sistema de gestão condominial que estou desenvolvendo. Ele tem módulos de ocorrências, reservas de áreas comuns, avisos, controle de encomendas, financeiro e um assistente de IA, e três perfis de usuário: morador, síndico e portaria.

Como qualquer sistema que lida com pessoas, ele trata dados pessoais. A proposta aqui é responder quatro perguntas sobre isso: quais dados o sistema capta, quais ele armazena, quais ele compartilha e quais ele comercializa. Antes de responder, porém, precisei entender uma coisa que não é óbvia e que muda a resposta de todas as quatro.

## Quem é responsável pelos dados

A LGPD separa dois papéis. O controlador é quem decide por que e como os dados vão ser tratados (art. 5º, VI). O operador é quem trata os dados em nome do controlador, seguindo as instruções dele (art. 5º, VII).

Quando fui encaixar o Zeluvi nessa divisão, percebi que ele ocupa os dois papéis, dependendo do dado.

Em relação aos dados dos moradores, o controlador é o condomínio. É ele quem decide arrecadar a taxa, controlar quem entra e sai, registrar ocorrências. O Zeluvi é apenas o operador: fornece a ferramenta e trata os dados por conta do condomínio. Isso significa que eu não posso decidir sozinho novas finalidades para esses dados, e que preciso de um contrato específico de tratamento com cada condomínio cliente, definindo o que posso fazer, por quanto tempo, com quais subcontratados. Se eu extrapolar as instruções e começar a decidir finalidades por conta própria, deixo de ser operador e viro controlador daquele tratamento, com responsabilidade integral (art. 42, § 1º).

Já em relação aos dados do próprio cliente, o Zeluvi é controlador. Isso inclui o cadastro e o faturamento do condomínio, os dados do síndico enquanto usuário do software, os logs de uso do produto, a telemetria, os leads que chegam pelo site.

Essa separação parece detalhe teórico, mas tem efeito prático imediato: a política de privacidade do Zeluvi não pode tratar tudo como "nossos usuários". São duas relações jurídicas diferentes e cada uma precisa da sua própria seção.

## Como levantei os dados

Não dá para mapear de memória. O que fiz foi partir do código e do banco, em quatro passos.

Primeiro, listei todos os pontos de entrada de dado no sistema. Isso quer dizer todo formulário e todo campo de input do front, todos os schemas de validação (eles já são praticamente um catálogo de campos pronto), todas as rotas POST e PUT da API, os uploads de arquivo, os webhooks que recebem dados de fora e a coleta automática que acontece sem o usuário digitar nada, como cookies, IP, user-agent e logs de acesso.

Alguns comandos que usei para isso:

```bash
grep -rn "<input\|<form\|<textarea" src/ --include="*.jsx"
grep -rn "z.object\|yup.object" src/
grep -rn "app.post\|router.post\|\.insert(" src/ server/
grep -rn "localStorage\|document.cookie" src/
```

Segundo, varri o schema do banco coluna por coluna, com um select simples no `information_schema.columns`, e classifiquei cada coluna: identificação, contato, autenticação, financeiro, log de comportamento, conteúdo escrito pelo próprio usuário, e as duas categorias que exigem cuidado extra, que são dado sensível (art. 5º, II) e dado de criança ou adolescente (art. 14).

Terceiro, desenhei o caminho de cada módulo em uma linha só: de onde o dado vem, onde ele fica, quem consegue ler, para onde ele sai e quando é apagado. Por exemplo, no módulo de ocorrências: o morador escreve o texto e anexa fotos, isso vai para a tabela de ocorrências e para o bucket de anexos, é lido pelo autor e pelo síndico, dispara uma notificação por e-mail, e some depois de vinte e quatro meses.

Quarto, consolidei tudo em fichas, uma por atividade de tratamento. Vale dizer que a unidade da ficha é a atividade, não o campo. "Gestão de encomendas" é uma atividade; "nome do destinatário" é um campo dentro dela. Confundir os dois gera um documento gigante e inútil.

O conjunto dessas fichas é o que a LGPD chama de registro das operações de tratamento, no art. 37, e o que o mercado costuma chamar de ROPA. No Zeluvi deram treze fichas.

## 1. Dados captados

A tabela abaixo resume o que cada módulo coleta e sob qual hipótese legal do art. 7º. Usei as abreviações: CTR para execução de contrato (inciso V), OBL para obrigação legal ou regulatória (inciso II), LI para legítimo interesse (inciso IX), CONS para consentimento (inciso I) e DIR para exercício regular de direitos (inciso VI).

| Módulo | Dados coletados | Hipótese legal |
|---|---|---|
| Cadastro | Nome, CPF, e-mail, telefone, unidade, vínculo com o imóvel, foto de perfil | CTR e OBL |
| Autenticação | Hash de senha, token, IP, user-agent, horário de login, tentativas malsucedidas | LI |
| Ocorrências | Texto livre, fotos e vídeos, unidade envolvida, menções a vizinhos, data e hora | CTR |
| Reservas | Espaço, data, horário, quantidade e nome dos convidados | CTR |
| Avisos | Lista de destinatários e confirmação de leitura | CTR |
| Encomendas | Nome do destinatário, transportadora, código de rastreio, foto da etiqueta, horários de chegada e retirada | CTR |
| Portaria | Nome e documento do visitante, foto, placa do veículo, quem autorizou, entrada e saída | LI |
| Financeiro | Boleto, valor, histórico de pagamento, situação de inadimplência, acordos | CTR, OBL e DIR |
| Assistente de IA | Texto digitado pelo usuário e o contexto do condomínio enviado junto | LI ou CONS, conforme o desenho |
| Telemetria | Páginas acessadas, cliques, dispositivo, IP, erros | LI para o essencial, CONS para o resto |
| Suporte | E-mail, prints, descrição do problema | CTR |
| Site | Nome, e-mail, telefone e condomínio de quem preenche o formulário | CONS |
| Faturamento | CNPJ do condomínio, nome e CPF do responsável, dados de cobrança | CTR e OBL |

Três observações sobre essa lista.

A primeira é sobre necessidade. O art. 6º, III diz que a coleta deve se limitar ao mínimo necessário para a finalidade. Aplicando isso ao Zeluvi, o CPF do morador é discutível: ele só se justifica onde existe cobrança ou emissão de documento fiscal. Para identificar alguém dentro do prédio, nome e unidade resolvem. Ainda não removi o campo, mas é uma dívida que anotei.

A segunda é sobre os terceiros. Vários módulos coletam dados de gente que nem usuária do sistema é: os convidados de uma reserva, os visitantes registrados na portaria, o remetente que aparece na etiqueta da encomenda, o vizinho citado no texto de uma ocorrência. Essas pessoas também são titulares e têm os mesmos direitos, mesmo sem nunca ter aberto o app. Isso é fácil de esquecer.

A terceira é sobre campo livre. O `textarea` da ocorrência aceita qualquer coisa, e na prática as pessoas escrevem qualquer coisa. Se um morador registra que o vizinho é alcoólatra, ou que precisa de vaga adaptada por ser cadeirante, o sistema acabou de armazenar dado sensível de saúde sem ter previsto isso em lugar nenhum. Não existe solução técnica perfeita para isso; o que dá para fazer é avisar no próprio formulário e permitir que o síndico edite antes de encaminhar.

## 2. Dados armazenados

O dado não fica em um lugar só, e essa foi a parte que mais me surpreendeu ao mapear. Além do banco principal, os dados do Zeluvi passam pelo storage de arquivos (fotos de ocorrência, etiquetas, avatares), pelos backups, pelos logs da aplicação, pelo cache de sessão, pelo serviço de e-mail transacional (que guarda o corpo das mensagens enviadas, com nome e unidade dentro), pela ferramenta de analytics, pelo navegador do próprio usuário e pelo provedor do modelo de linguagem que roda o assistente.

Backup e log são os dois pontos cegos. É onde o dado "excluído" continua existindo por meses depois de o usuário ter pedido a exclusão. Qualquer política de retenção que não fale explicitamente dos dois está incompleta.

Sobre prazos, a LGPD não dá números. Os arts. 15 e 16 dizem que o tratamento termina quando a finalidade se esgota e que o dado deve então ser eliminado, com poucas exceções. Coube a mim definir prazos defensáveis:

| Dado | Prazo | Motivo |
|---|---|---|
| Cadastro de morador | Enquanto durar o vínculo com a unidade | Fim da finalidade |
| Cadastro após a saída | Mais 12 meses, depois anonimizar | Ocorrências e cobranças pendentes |
| Ocorrências encerradas | 24 meses | Histórico de reincidência |
| Registro de visitante | 6 a 12 meses | Segurança patrimonial |
| Foto da etiqueta de encomenda | 7 dias após a retirada | Utilidade curta e risco alto |
| Documentos financeiros | 5 anos | Prazo prescricional e obrigação fiscal |
| Logs de acesso | 6 meses | Art. 15 do Marco Civil da Internet |
| Conversas com o assistente | 30 a 90 dias | Depuração |
| Backups | 30 a 90 dias em rotação | Contingência |

Quanto à segurança, os arts. 46 a 49 exigem medidas técnicas e administrativas adequadas, sem detalhar quais. Para o Zeluvi, as que considero indispensáveis são criptografia em repouso e em trânsito, controle de acesso implementado no banco (com row level security) e não apenas na interface, isolamento rigoroso entre condomínios, autenticação em dois fatores para as contas de síndico e portaria, que são as que enxergam muitos titulares de uma vez, log de auditoria de quem acessou o quê, e uso de dados sintéticos em ambiente de desenvolvimento. Essa última é a regra que mais gente quebra: rodar dump de produção em máquina de desenvolvedor é vazamento esperando acontecer.

## 3. Dados compartilhados

Compartilhamento aqui tem três sentidos diferentes, e demorei um pouco para separá-los.

### Entre os próprios usuários do sistema

Este é o mais importante e o menos óbvio. Quando o síndico abre a tela de inadimplência e vê o nome de um morador, isso é compartilhamento de dado pessoal. Quando a portaria consulta os convidados de uma reserva, também. A arquitetura de permissões do Zeluvi é, literalmente, a política de compartilhamento do sistema.

Montei uma matriz cruzando cada tipo de dado com cada perfil:

| Dado | Próprio morador | Outro morador | Síndico | Portaria |
|---|---|---|---|---|
| Nome e unidade | Sim | Sim | Sim | Sim |
| CPF | Sim | Não | Só para cobrança | Não |
| Telefone e e-mail | Sim | Não | Sim | Só para contato de entrega |
| Ocorrência que ele abriu | Sim | Não | Sim | Só as de segurança |
| Ocorrência contra ele | Sim, por contraditório | Não | Sim | Não |
| Inadimplência | Sim | Nunca | Sim | Nunca |
| Reservas | Sim | Só a disponibilidade, sem nome | Sim | Sim, no dia |
| Encomendas | Sim | Não | Só o agregado | Sim |
| Histórico de acesso dele | Sim | Não | Com justificativa registrada | Não |

A linha da inadimplência merece destaque. Expor morador inadimplente para os demais, seja em mural, em lista dentro do app ou em assembleia, já rendeu bastante condenação por dano moral nos tribunais brasileiros, e sob a LGPD ainda viola a finalidade do art. 6º, I. Por isso essa restrição não pode ser uma regra de interface, onde qualquer refatoração descuidada derruba. Tem que estar no banco.

### Com fornecedores que processam dados para mim

Hospedagem, storage, serviço de e-mail, gateway de pagamento, disparo de SMS ou WhatsApp, provedor do modelo de IA, analytics e monitoramento de erro. Todos recebem dado pessoal, todos precisam de contrato, e a maioria deles fica fora do Brasil.

Transferência internacional tem regra própria nos arts. 33 a 36. Só é lícita se houver hipótese válida, e a via mais prática hoje são as cláusulas-padrão contratuais que a ANPD aprovou pela Resolução CD/ANPD nº 19/2024. Na prática isso significa checar, fornecedor por fornecedor, se o contrato deles já incorpora essas cláusulas.

O caso do provedor de IA é o mais delicado dos oito. O que sai daqui não é um campo estruturado e previsível: é texto livre digitado pelo usuário mais o contexto do condomínio que eu anexo ao pedido. Duas coisas precisam estar no contrato, sem margem: retenção curta ou nula, e proibição expressa de usar esse conteúdo para treinar modelo.

Além disso, preciso manter pública e atualizada a lista desses fornecedores, e o condomínio, como controlador, precisa autorizá-los no contrato.

### Com terceiros que são controladores por conta própria

Administradora, contabilidade, escritório de cobrança, seguradora e, quando houver requisição formal, órgãos públicos e Judiciário. Cada um com sua base legal. No caso da cobrança, é exercício regular de direitos, e por isso não depende de consentimento do morador.

Vale registrar que o art. 18, VII dá ao titular o direito de saber com quais entidades os dados dele foram compartilhados. Cumprir isso exige log de compartilhamento, não só cláusula em contrato.

## 4. Dados comercializados

Nenhum. E essa resposta precisa estar escrita em algum lugar, porque ausência de política costuma virar política por omissão depois.

O Zeluvi não vende, aluga nem cede dados pessoais de moradores, visitantes ou condomínios. Isso não é só uma escolha minha, é consequência da estrutura montada lá no começo deste documento: em relação aos dados dos moradores eu sou operador, e esses dados não me pertencem. Vender seria tratar fora das instruções do controlador, o que o art. 39 proíbe. Some-se a isso a incompatibilidade de finalidade: o dado foi coletado para administrar o condomínio, e vender para publicidade é finalidade incompatível com a original, o que nem consentimento posterior resolve bem.

Tem também um argumento que não é jurídico. Um aplicativo que concentra quem entra, quem sai, quem paga em dia e quem reclama de quem é, na prática, um retrato bastante detalhado da vida privada de centenas de famílias. É o pior lugar imaginável para se construir um modelo de receita baseado em dados.

Dito isso, existe uma faixa cinza que analisei, porque em algum momento alguém vai perguntar se dá para monetizar isso:

Estatística agregada e anonimizada fica fora do alcance da LGPD, pelo art. 12. Poderia, em tese, gerar um relatório de mercado do tipo "condomínios entre cinquenta e cem unidades registram em média tantas ocorrências por mês". Mas anonimizar não é tirar o nome. O art. 12, § 1º exige que a reidentificação seja inviável por meios razoáveis, e em um prédio de quarenta apartamentos "o morador do bloco B que abriu doze ocorrências" identifica uma pessoa específica sem esforço nenhum. Se eu for por esse caminho, tem que ser com limiar mínimo de agregação, remoção de quase-identificadores como unidade e data exata, e teste documentado de reidentificação.

Um marketplace de prestadores dentro do app seria lícito, desde que o dado só saia quando o morador clicar e contratar. Enviar lista de moradores para o fornecedor prospectar, não.

Publicidade contextual, por tipo de condomínio, sem perfilar ninguém, também seria possível. Publicidade comportamental com perfil individual entraria no art. 20 e no consentimento específico, e eu descartei.

## O que ficou marcado como risco alto

Cinco coisas saíram do mapeamento com sinal vermelho, e são candidatas a relatório de impacto à proteção de dados pessoais, previsto no art. 38.

O assistente de IA, porque o conteúdo sai do meu ambiente, pode carregar dado de terceiro e depende de um contrato que eu ainda não tenho fechado.

Os dados de crianças e adolescentes, porque dependentes aparecem no cadastro, convidados menores aparecem em reservas, e o art. 14 exige tratamento no melhor interesse do menor, com consentimento de um dos pais quando a base for consentimento.

Biometria facial e CFTV, caso eu integre. Biometria é dado sensível pelo art. 5º, II e cai no art. 11, o que muda completamente as exigências. Videomonitoramento exige aviso ostensivo e retenção curta.

A inadimplência, pelo motivo já explicado.

E o campo livre de ocorrências, que é a porta pela qual dado sensível entra no sistema sem eu ter previsto.

## O que isso muda no código

Fechando, o mapeamento só vale alguma coisa se virar tarefa. As que tirei dele:

Manter um dicionário de dados versionado no próprio repositório, atualizado junto com cada migration, para o mapeamento não envelhecer em três meses. Mover a autorização para o banco, com row level security por condomínio e por perfil. Criar a rotina agendada que apaga e anonimiza conforme os prazos da seção 2. Construir a área do titular dentro do app, onde a pessoa consegue ver, corrigir, exportar e pedir exclusão dos próprios dados, lembrando que o art. 19, II dá quinze dias para responder ao pedido de acesso completo. Limpar dado pessoal dos logs e do monitoramento de erro. Registrar consentimento com data, versão do texto e origem, onde ele for a base usada. Publicar a lista de fornecedores. Escrever o contrato de tratamento que vai anexo ao contrato com o condomínio. E montar o plano de resposta a incidente, porque a Resolução CD/ANPD nº 15/2024 dá três dias úteis para comunicar a ANPD, e três dias úteis passam rápido quando não existe plano.

Uma nota final: como startup, o Zeluvi provavelmente se enquadra como agente de tratamento de pequeno porte, o que a Resolução CD/ANPD nº 2/2022 reconhece e para o qual prevê um regime simplificado, com prazos mais longos e exigências reduzidas. Isso alivia parte da burocracia, mas não dispensa nem o registro das operações nem o canal de atendimento ao titular.

## Referências

Lei nº 13.709/2018, Lei Geral de Proteção de Dados Pessoais.
Lei nº 12.965/2014, Marco Civil da Internet, art. 15.
Código Civil, art. 1.348.
Resolução CD/ANPD nº 2/2022, sobre agentes de tratamento de pequeno porte.
Resolução CD/ANPD nº 15/2024, sobre comunicação de incidente de segurança.
Resolução CD/ANPD nº 19/2024, sobre transferência internacional e cláusulas-padrão contratuais.
ANPD, orientações sobre o Relatório de Impacto à Proteção de Dados Pessoais.
Governo Federal, Programa de Privacidade e Segurança da Informação, Guia de Elaboração de Inventário de Dados Pessoais.
