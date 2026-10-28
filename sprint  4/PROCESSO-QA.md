
# 🧪 Processo de QA — Qualidade de Software

![QA](https://img.shields.io/badge/Área-Quality%20Assurance-blue)
![Versão](https://img.shields.io/badge/Versão-1.0-green)
![Status](https://img.shields.io/badge/Status-Documentado-success)

> **Responsável:** Danilo — QA  
> **Objetivo:** Padronizar o controle de qualidade, o fluxo de desenvolvimento e a documentação de testes do projeto durante as sprints.

---

## 📑 Sumário

- [1. Objetivo](#-1-objetivo)
- [2. Fluxo de Branches](#-2-fluxo-de-branches)
- [3. Abertura de Bugs](#-3-abertura-de-bugs)
- [4. Casos de Teste](#-4-casos-de-teste)
- [5. Responsabilidades do QA](#-5-responsabilidades-do-qa)
- [6. Aplicação nas Sprints](#-6-aplicação-nas-sprints)

---

## 🎯 1. Objetivo

Estabelecer padrões para o desenvolvimento colaborativo, a identificação de defeitos e a validação das funcionalidades.

Este documento servirá como referência para todos os integrantes da equipe durante o semestre, podendo ser atualizado conforme a evolução do projeto.

---

## 🌿 2. Fluxo de Branches

O projeto utilizará um fluxo simplificado de Git Flow para organizar o desenvolvimento e evitar alterações diretas na versão estável.

| Branch | Finalidade |
|---|---|
| `main` | Versão estável do projeto, pronta para entrega. |
| `develop` | Integração das funcionalidades em desenvolvimento. |
| `feature/nome-da-tarefa` | Desenvolvimento isolado de cada funcionalidade ou tarefa. |

### 🔄 Fluxo de trabalho

1. Criar uma branch de funcionalidade a partir de `develop`.
2. Implementar as alterações necessárias.
3. Enviar a branch para o GitHub.
4. Abrir um Pull Request (PR) direcionado à `develop`.
5. Revisar as alterações e validar se estão corretas.
6. Realizar o merge após a aprovação.
7. Integrar uma versão validada à `main` por meio de Pull Request.

### 📌 Regras do grupo

- Não realizar alterações diretamente na `main`.
- Não realizar merge sem Pull Request.
- Utilizar nomes claros e objetivos para as branches.
- Manter cada branch focada em uma tarefa específica.
- Revisar as alterações antes da integração.

**Exemplo de branch:**

`feature/cadastro-usuario`

---

## 🐛 3. Abertura de Bugs

Todo defeito identificado deverá ser registrado de forma clara, permitindo que outro integrante consiga reproduzir o problema e realizar a correção.

### 📋 Modelo de bug

| Campo | Descrição |
|---|---|
| **Título** | Resumo objetivo do problema. |
| **Descrição** | Explicação do defeito identificado. |
| **Passos para reproduzir** | Sequência de ações necessárias para reproduzir o erro. |
| **Resultado esperado** | Comportamento correto previsto. |
| **Resultado obtido** | Comportamento observado durante o teste. |
| **Evidência** | Print ou captura de tela do problema. |
| **Responsável** | Integrante que identificou o defeito. |
| **Prioridade** | Baixa, média ou alta. |

### 💡 Exemplo de bug

**Título:** Cadastro permite continuar sem e-mail.

**Descrição:** O formulário permite prosseguir com o cadastro sem preencher o campo de e-mail.

**Passos para reproduzir:**
1. Acessar a tela de cadastro.
2. Preencher os demais campos obrigatórios.
3. Deixar o e-mail vazio.
4. Clicar em cadastrar.

**Resultado esperado:** O sistema deve impedir o cadastro e informar que o e-mail é obrigatório.

**Resultado obtido:** O sistema permite continuar sem preencher o e-mail.

**Evidência:** Anexar uma captura de tela demonstrando o problema.

**Responsável:** Nome do integrante que identificou o bug.

**Prioridade:** Alta.

---

## ✅ 4. Casos de Teste

Os casos de teste serão utilizados para verificar se as funcionalidades atendem aos requisitos definidos para o projeto.

### 📝 Padrão de documentação

| Campo | Descrição |
|---|---|
| **ID** | Identificador único, como `CT-001`. |
| **Nome** | Nome resumido do teste. |
| **Funcionalidade** | Recurso que será testado. |
| **Pré-condições** | Condições necessárias antes do teste. |
| **Passos de execução** | Ações realizadas pelo testador. |
| **Resultado esperado** | Comportamento previsto. |
| **Resultado obtido** | Comportamento observado. |
| **Status** | Aprovado, reprovado ou bloqueado. |
| **Responsável** | Integrante que executou o teste. |

### 🧩 Exemplo de caso de teste

**ID:** CT-001

**Nome:** Cadastro com dados válidos.

**Funcionalidade:** Cadastro de usuário.

**Pré-condições:** Sistema disponível e usuário ainda não cadastrado.

**Passos de execução:**
1. Acessar a tela de cadastro.
2. Preencher os campos obrigatórios com dados válidos.
3. Confirmar o cadastro.

**Resultado esperado:** O cadastro deve ser concluído e o sistema deve apresentar uma mensagem de sucesso.

**Resultado obtido:** Preencher após executar o teste.

**Status:** Aprovado / Reprovado / Bloqueado.

**Responsável:** Nome do integrante.

### 📊 Significado dos status

- 🟢 **Aprovado:** o resultado corresponde ao esperado.
- 🔴 **Reprovado:** o resultado diverge do esperado.
- 🟡 **Bloqueado:** não foi possível concluir o teste por alguma dependência ou impedimento.

---

## 🛡️ 5. Responsabilidades do QA

Compete ao responsável por Quality Assurance:

- Definir e manter os padrões de documentação de testes e bugs.
- Apoiar a validação das funcionalidades desenvolvidas.
- Registrar defeitos com informações suficientes para sua reprodução.
- Verificar se as correções resolvem os problemas identificados.
- Apoiar a revisão das entregas antes da integração.
- Atualizar a documentação quando houver mudanças no processo de trabalho.

---

## 🚀 6. Aplicação nas Sprints

Os padrões definidos serão aplicados ao longo do semestre, acompanhando a evolução do projeto.

A cada sprint, os casos de teste poderão ser elaborados conforme as funcionalidades desenvolvidas. Os bugs encontrados deverão ser registrados, corrigidos e validados conforme a necessidade.

O processo poderá ser ajustado em conjunto com a equipe para manter a documentação útil e compatível com a realidade do projeto.

---

**Documento mantido por:** Danilo — QA  
**Versão:** 1.0
