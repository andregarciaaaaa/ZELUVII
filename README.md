<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:4F46E5,50:7C3AED,100:06B6D4&height=200&section=header&text=ZELUVII&fontColor=ffffff&fontSize=70&fontAlignY=38&desc=Gest%C3%A3o%20condominial%20simples%2C%20acess%C3%ADvel%20e%20inteligente&descAlignY=58&descSize=18" alt="ZELUVII" />

<img src="assets/logo/logo.png" alt="Logo Zeluvi" width="140" />

<br/>

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-F59E0B?style=for-the-badge)
![Projeto](https://img.shields.io/badge/projeto-acad%C3%AAmico-4F46E5?style=for-the-badge)
![Curso](https://img.shields.io/badge/ADS-Unicesumar-7C3AED?style=for-the-badge)
![Licen%C3%A7a](https://img.shields.io/badge/uso-educacional-06B6D4?style=for-the-badge)

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white)

**[Sobre](#-sobre-o-projeto) · [Funcionalidades](#-funcionalidades) · [Diferencial](#-nosso-diferencial) · [Arquitetura](#-arquitetura) · [Como rodar](#-como-rodar-o-protótipo) · [Estrutura](#-estrutura-do-repositório) · [Equipe](#-equipe)**

</div>

---

## 🏢 Sobre o projeto

O **Zeluvi** é uma plataforma de **gestão condominial** (web e mobile) que reúne em um só lugar a comunicação, as ocorrências, as reservas e as encomendas de um condomínio.

Hoje, boa parte disso acontece em grupos de WhatsApp: avisos que se perdem, problemas sem acompanhamento e reservas combinadas na base da conversa. O Zeluvi organiza tudo isso, com telas feitas para **qualquer pessoa usar**, com letra grande, contraste alto e botões fáceis de tocar.

> 💡 **Ideia central:** transformar o dia a dia do condomínio em algo **organizado, rastreável e transparente** para moradores, síndico e portaria.

---

## 👥 Para quem é

<table>
  <tr>
    <td align="center" width="33%">
      <h3>🏠 Morador</h3>
      Registra ocorrências, recebe comunicados, faz reservas, avisa mudanças e acompanha cada solicitação.
    </td>
    <td align="center" width="33%">
      <h3>🧑‍💼 Síndico / Administração</h3>
      Gerencia ocorrências e reservas, envia comunicados e administra o cadastro de moradores.
    </td>
    <td align="center" width="33%">
      <h3>🛎️ Portaria</h3>
      Controla recebimento e entrega de encomendas, registra mudanças e acompanha as ocorrências relevantes.
    </td>
  </tr>
</table>

---

## ✨ Funcionalidades

| | Módulo | O que faz |
|:-:|---|---|
| 📣 | **Comunicação** | Comunicados da administração, notificações e canal direto entre moradores e síndico |
| 🛠️ | **Ocorrências** | Relato de problemas (manutenção, limpeza, elevador, iluminação) com status e histórico em linha do tempo |
| 📅 | **Reservas** | Salão de festas, churrasqueira, espaço gourmet e elevador de serviço, com regras e antecedência mínima |
| 📦 | **Encomendas** | Gestão de entregas e encomendas feita pela portaria |
| 🤝 | **Serviços** | Profissionais indicados e avaliados pelos próprios moradores |
| 🤖 | **Inteligência artificial** | Copiloto do Síndico, automações, painel executivo e assembleias digitais com transcrição |

---

## 🌟 Nosso diferencial

### Serviços indicados pela comunidade

Quem nunca viu no grupo do condomínio: *"Alguém conhece um eletricista?"*

As indicações ficam espalhadas, perdidas entre mensagens antigas, sem informação de preço ou qualidade. No Zeluvi, o morador escolhe o serviço que precisa (elétrica, hidráulica, pintura, máquina de lavar...) e vê **profissionais já usados por vizinhos**, com contato direto e avaliações.

> **Rodrigo** — ⭐⭐⭐⭐⭐
> *"Profissional confiável, realizou o serviço corretamente e cobrou R$ 100."*

Assim, a recomendação informal vira uma **rede organizada de confiança**, e bons profissionais constroem reputação dentro da própria comunidade.

> 📖 Mais detalhes em [`docs/02-pesquisa/Diferencial.md`](docs/02-pesquisa/Diferencial.md)

---

## 🧱 Arquitetura

```mermaid
flowchart LR
    A[📱 App Mobile<br/>Morador] --> C
    B[💻 App Web<br/>Síndico · Portaria · Morador] --> C
    C{{🔌 API REST<br/>JWT · /v1}} --> D[⚙️ Serviços de domínio<br/>Comunicação · Ocorrências<br/>Reservas · Serviços · IA]
    D --> E[(🐘 PostgreSQL)]
    D --> F[(⚡ Redis · Filas)]

    style A fill:#4F46E5,stroke:#312E81,color:#fff
    style B fill:#7C3AED,stroke:#4C1D95,color:#fff
    style C fill:#06B6D4,stroke:#0E7490,color:#fff
    style D fill:#F59E0B,stroke:#B45309,color:#000
    style E fill:#10B981,stroke:#047857,color:#fff
    style F fill:#EF4444,stroke:#991B1B,color:#fff
```

- **Monólito modular e stateless**, com uma única API REST consumida por web e mobile
- **Multi-tenant por condomínio:** cada dado carrega o identificador do condomínio
- **Camadas no backend:** Rota → Middlewares → Controller → Service → Repository → Prisma → PostgreSQL
- **Acessibilidade por padrão:** letra grande, contraste alto e alvos de toque de 56 px

> 📖 Detalhes em [`docs/05-arquitetura/`](docs/05-arquitetura/)

---

## 🚀 Como rodar o protótipo

O protótipo do front-end é uma página estática (HTML, CSS e React carregado por CDN), então **não precisa instalar dependências**.

```bash
# 1. Clone o repositório
git clone https://github.com/andregarciaaaaa/ZELUVII.git
cd ZELUVII

# 2. Sirva a pasta src (escolha uma das opções)
npx serve src
# ou
python -m http.server 8000 --directory src
```

Depois, abra no navegador o endereço que aparecer (por exemplo `http://localhost:3000` ou `http://localhost:8000`).

> ⚠️ É preciso estar **conectado à internet**: React, fontes e o visualizador 3D são carregados por CDN.

---

## 🗂️ Estrutura do repositório

```text
ZELUVII/
├── 📄 README.md
├── 🖼️ assets/
│   └── logo/                  # Logotipos do projeto
├── 💻 src/                    # Protótipo do front-end
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── assets/                # Vídeo e modelo 3D do prédio
└── 📚 docs/
    ├── 01-planejamento/       # Escopo, RACI, SWOT, GUT, Diamante Duplo
    ├── 02-pesquisa/           # Pesquisa de mercado, CDC, LGPD, diferencial
    ├── 03-dominio-e-marca/    # Domínio (GoDaddy, Registro.br) e registro no INPI
    ├── 04-modelagem/          # Casos de uso, classes, DER e sequência
    ├── 05-arquitetura/        # Definição arquitetural, system design, escalabilidade
    ├── 06-qualidade/          # Definition of Done, processo e plano de testes de QA
    ├── 07-sprints/            # Entregas por fase e sprint
    └── prototipos/            # Protótipos de tela
```

---

## 📚 Documentação

| 📁 Pasta | 📝 Conteúdo |
|---|---|
| [`01-planejamento`](docs/01-planejamento/) | Escopo do projeto, matriz RACI, SWOT, matriz GUT, Modelo Diamante Duplo |
| [`02-pesquisa`](docs/02-pesquisa/) | Pesquisa de mercado, CDC, LGPD e diferencial |
| [`03-dominio-e-marca`](docs/03-dominio-e-marca/) | Estratégia de domínio e registro da marca |
| [`04-modelagem`](docs/04-modelagem/) | Diagramas de caso de uso, classes, DER e sequência |
| [`05-arquitetura`](docs/05-arquitetura/) | Arquitetura, system design e escalabilidade |
| [`06-qualidade`](docs/06-qualidade/) | Definition of Done e plano de testes |
| [`07-sprints`](docs/07-sprints/) | Entregas de cada fase e sprint |
| [`prototipos`](docs/prototipos/) | Protótipos de login, recuperação de senha e dashboard |

---

## 🛣️ Roadmap

- [x] Planejamento e escopo
- [x] Modelagem (casos de uso, classes, DER)
- [x] Definição de arquitetura
- [x] Protótipo do front-end
- [x] Especificação das APIs de autenticação e moradores
- [ ] Backend (API REST + banco de dados)
- [ ] Integração do front-end com a API
- [ ] Aplicativo mobile
- [ ] Módulos de inteligência artificial

---

## 🤝 Equipe

Projeto desenvolvido em grupo, como trabalho acadêmico.

<a href="https://github.com/andregarciaaaaa/ZELUVII/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=andregarciaaaaa/ZELUVII" alt="Contribuidores" />
</a>

---

<div align="center">

Feito com 💜 por estudantes de Análise e Desenvolvimento de Sistemas

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:06B6D4,50:7C3AED,100:4F46E5&height=100&section=footer" alt="" />

</div>
