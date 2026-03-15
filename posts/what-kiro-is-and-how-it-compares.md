---
title: "What Kiro Is and How It Compares to VS Code"
date: "2026-03-14"
slug: "what-kiro-is-and-how-it-compares"
summary: "A simple mental model for Kiro, Amazon Q, and the shift toward agent IDEs."
---

# What Kiro Is and How It Compares to VS Code

The simplest way to understand it:

**Kiro is an IDE similar to VS Code, but built specifically for AI agents and Amazon Q.**

Think of it like this:

| Tool | What it is |
| --- | --- |
| **Visual Studio Code** | general-purpose coding IDE |
| **Cursor IDE** | AI-first coding IDE |
| **Kiro IDE** | AI-agent development IDE |
| **Amazon Q Developer** | the AI model or assistant running inside it |

So Kiro is the environment, and Amazon Q is the brain inside it.

## How Kiro compares to VS Code

| Feature | VS Code | Kiro |
| --- | --- | --- |
| Editing files | Yes | Yes |
| Extensions | Yes | Limited |
| AI coding | Plugin-based | Built in |
| Agents | No | Core feature |
| Model selection | No | Yes |
| Agent configs | No | `agent.json`, skills, context |

## Why Amazon built Kiro

Traditional IDE flow:

```text
write code
compile
run
debug
```

Agent IDE flow:

```text
define agent
give context
add tools and skills
select model
agent performs tasks
```

So instead of writing code directly, you often define systems that generate or modify code.

## Typical Kiro project structure

```text
.kiro/
  agents/
    backend-agent.json
  skills/
    gitlab/
      SKILL.md
  context/
    architecture.md
```

Inside the IDE you can:

- chat with the agent
- run agent tasks
- switch models
- test workflows

## Model selection

In Kiro you can choose models such as:

- Claude Sonnet
- Claude Opus
- Amazon Titan
- sometimes OpenAI models

So an agent config might say:

```json
{
  "model": "claude-sonnet"
}
```

Or it might route between models depending on the task.

## How this fits with the other tools

| Tool | Category |
| --- | --- |
| Kiro | agent IDE |
| Cursor | AI coding IDE |
| Copilot | code assistant |
| Claude Code | autonomous coding agent |
| Codex | coding LLM |

## Why this matters

If your stack includes MCP, skills, context files, `agent.json`, and workflow orchestration, you are already operating in the direction Kiro is designed for.

That is the larger shift: from single prompts to internal agent systems.
