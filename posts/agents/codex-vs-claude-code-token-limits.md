---
title: "Codex vs Claude Code: Why You're Running Out of Tokens (And How to Fix It)"
date: "2026-03-26"
slug: "codex-vs-claude-code-token-limits"
summary: "A practical comparison of OpenAI Codex and Claude Code, why Claude Code burns through tokens fast, and the best practices to stay within rate limits."
---

I've been using Claude Code heavily for the past few weeks and kept hitting rate limits far sooner than expected. Coming from a background using OpenAI's Codex, the experience felt jarring. This post breaks down why, compares the two tools honestly, and shares the practices I now use to keep token consumption under control.

## Codex vs Claude Code: The Core Difference

Before diving into token strategy, it helps to understand what these two tools actually are — because they're solving different problems.

### OpenAI Codex

Codex (now largely superseded by GPT-4 and later models) was a **code completion engine** at heart. You gave it a function signature or a comment, and it autocompleted code. It was optimized for:

- Short, targeted completions
- Low-latency inline suggestions
- Stateless requests — no persistent context

Because each request was small and focused, token usage was naturally bounded. Codex didn't try to understand your entire repository; it worked on whatever you passed it.

### Claude Code

Claude Code is fundamentally different. It's an **agentic coding assistant** — it doesn't just autocomplete, it reasons, plans, reads files, runs commands, and iterates. A single user request like "refactor this module to use async/await" might trigger Claude to:

1. Read the target file
2. Grep for all call sites
3. Read related test files
4. Plan the changes
5. Edit multiple files
6. Verify the edits

Each of those steps consumes tokens. And unlike Codex, Claude Code maintains a **persistent conversation context** that grows with every turn. The model sees the full conversation history, all tool call results, and all file contents it has read.

### The Comparison at a Glance

| Dimension | Codex | Claude Code |
|---|---|---|
| Model type | Completion | Agentic reasoning |
| Context window usage | Per-request, small | Cumulative, grows over session |
| File reading | Manual, explicit | Automatic, as needed |
| Multi-step tasks | Manual chaining | Native |
| Token cost per task | Low (targeted) | High (contextual) |
| Best for | Autocomplete, snippets | Whole-task execution |

---

## Why Claude Code Eats Tokens So Fast

There are several structural reasons why token consumption spikes quickly.

### 1. The Context Window Accumulates

Every message you send, every tool result returned, every file Claude reads — all of it sits in the active context window. By the time you've had a 10-turn conversation and Claude has read 5 files, you might be 30,000–60,000 tokens deep before you've written a single line of code yourself.

Claude doesn't forget earlier parts of a long session automatically. The context grows until it's compressed or the session resets.

### 2. Tool Call Results Are Verbose

When Claude runs a command like `grep` or reads a file, the **full output** is returned into the context. A `git diff` on a large file can add thousands of tokens in one shot. Multiple tool calls stack up fast.

### 3. Agentic Loops Multiply Cost

When Claude attempts a task, hits an error, diagnoses it, and retries, that entire loop is visible in the context. A task that takes 4 attempts costs roughly 4x the tokens compared to one that succeeds immediately.

### 4. System Prompts and Instructions Add Baseline Cost

Claude Code includes a substantial system prompt by default — tool definitions, behavioral guidelines, and environment context. This baseline overhead exists on every single request, even for a one-line question.

### 5. File Contents Are Inlined

When Claude reads a file, the contents are injected directly into the context. Reading a 500-line file costs proportionally. Reading five 500-line files in one session means 2,500 lines of content sitting in memory, consuming tokens for every subsequent message.

---

## Best Practices to Avoid Hitting Token Rate Limits

These are the habits I've adopted that meaningfully reduced my token burn.

### Keep Sessions Short and Focused

The single most effective change: **one task per session**. Instead of having a marathon session where you ask Claude to refactor a module, then fix a bug, then write tests, start fresh sessions for each task.

A fresh session has zero accumulated context. It's much cheaper than the 50th message in a long thread.

### Be Specific in Your Requests

Vague requests force Claude to explore broadly. Compare:

- **Vague**: "Fix the authentication flow"
- **Specific**: "In `src/auth/login.ts`, the `validateToken` function on line 42 returns null when the JWT is expired instead of throwing an error. Fix that."

The specific version gives Claude exactly what it needs. It reads one file, makes a targeted change, done. The vague version may cause Claude to read the entire auth directory, check middleware, inspect tests, and explore multiple hypotheses.

### Avoid Asking Claude to Read Large Files Unnecessarily

If you know the relevant code, paste the snippet directly instead of asking Claude to find it. This prevents file reads that inflate the context.

```
# Instead of:
"Look at my database config and tell me why connections are timing out"

# Try:
"Here's my db config: [paste relevant 20 lines]. Why are connections timing out?"
```

### Use `/clear` to Reset Context

Claude Code's `/clear` command resets the conversation context without ending the session. If you've completed one task and are moving to the next, clearing the context prevents the prior task's file reads and tool results from carrying over.

Think of it as a cheap session restart. Use it liberally between unrelated tasks.

### Leverage CLAUDE.md for Persistent Instructions

Instead of explaining your project setup, coding conventions, or preferences at the start of every session, put them in a `CLAUDE.md` file at your project root. Claude reads this file automatically and uses it as baseline context.

This prevents you from burning tokens repeating yourself across sessions. You write it once; Claude reads it once per session as part of its startup context.

A minimal example for a TypeScript project:

```markdown
# CLAUDE.md

## Stack
- Next.js App Router
- TypeScript strict mode
- Tailwind CSS

## Conventions
- Use named exports, not default exports
- All async functions should have error boundaries
- Tests go in __tests__ alongside the source file

## Do Not
- Modify package.json without asking
- Use any or unknown types
```

#### Real-World Example: Financial Document Parser

Here's a more complete `CLAUDE.md` for a project that parses Google Docs containing income and expense data — a great example of how much context you can offload out of the conversation:

```markdown
# CLAUDE.md — Google Docs Financial Parser

## Project Purpose
Parse 4 Google Docs (Q1–Q4 expense/income reports), extract transactions,
group them by category, and produce a structured summary — while preserving
every individual transaction under its category (no collapsing or deduplication).

## Source Documents
- `docs/q1-2026.txt` — Q1 income and expenses (exported from Google Docs)
- `docs/q2-2026.txt` — Q2 income and expenses
- `docs/q3-2026.txt` — Q3 income and expenses
- `docs/q4-2026.txt` — Q4 income and expenses

Parse all four in sequence. Do NOT load all four into context at once.
Process one file, emit output, then move to the next.

## Transaction Format (Input)
Each line in a source doc follows one of these patterns:
  DATE | DESCRIPTION | AMOUNT | TYPE
  DATE | DESCRIPTION | AMOUNT (positive = income, negative = expense)

Dates are in MM/DD/YYYY format. Amounts may include $ signs and commas.

## Categories
Group every transaction into exactly one of these categories:
- Payroll
- Contractors
- Software & Subscriptions
- Office & Supplies
- Travel & Meals
- Marketing
- Revenue - Product
- Revenue - Services
- Tax & Compliance
- Miscellaneous

If a transaction cannot be classified, place it in Miscellaneous and
flag it with a `[REVIEW]` tag so it can be checked manually.

## Output Format
Produce a Markdown report with this structure for EACH document processed:

### [Quarter] Financial Report

#### Summary Table
| Category | Total Income | Total Expenses | Net |
|---|---|---|---|
| Payroll | $0 | $12,000 | -$12,000 |
...
| **TOTAL** | **$X** | **$Y** | **$Z** |

#### Transactions by Category

##### Payroll
| Date | Description | Amount | Type |
|---|---|---|---|
| 01/15/2026 | Salary - Alice | -$6,000 | Expense |
| 01/15/2026 | Salary - Bob | -$6,000 | Expense |

##### Revenue - Product
| Date | Description | Amount | Type |
|---|---|---|---|
| 01/03/2026 | Stripe payout | +$4,200 | Income |

[...all other categories with their transactions...]

IMPORTANT: Always list every individual transaction under its category.
Never roll up or collapse transactions into a single row per category in
the transactions section. The summary table is the only place that aggregates.

## Processing Rules
1. One file at a time — process docs/q1-2026.txt fully before reading q2
2. Output the full Markdown report for each quarter before moving to the next
3. After all four quarters, produce a combined annual summary table (summary only, no repeated transactions)
4. Flag any line that doesn't match the expected format with [PARSE ERROR]
5. Amounts: normalize to plain numbers (remove $, commas). Store as negative for expenses, positive for income.

## Do Not
- Load all 4 source files into context simultaneously
- Deduplicate transactions that happen to have the same amount/date
- Omit the transactions table for any category that has entries
- Round amounts — preserve cents
- Ask clarifying questions mid-parse — use the rules above and flag unknowns with [REVIEW]

## Token Efficiency Notes
- After finishing each quarter's report, use /clear before processing the next quarter
- If a source file exceeds 500 lines, ask the user to split it before proceeding
- Emit the summary table first, then the transaction tables — allows early review
```

This `CLAUDE.md` eliminates virtually every clarifying question Claude might ask at the start of a session. Category rules, output format, processing order, edge case handling — it's all defined once. The result is that each session starts executing immediately rather than spending the first several turns establishing context.

### Scope Your Tool Access

If you're doing a focused task (e.g., only editing one component), tell Claude explicitly what it does and doesn't need to look at. This prevents exploratory reads that inflate context:

> "Only look at files in `src/components/Auth/`. Don't read anything else."

### Break Large Tasks Into Subtasks

Instead of "migrate the entire codebase from CommonJS to ESM", break it into:

1. "Migrate `src/lib/utils.ts` to ESM" (one session)
2. "Migrate `src/api/client.ts` to ESM" (fresh session)
3. ...

Each session is cheap. One monolithic session reading dozens of files is expensive and risks hitting limits mid-task.

### Monitor What Claude Is Reading

Pay attention to Claude's tool calls. If you see it reading files that aren't relevant to your task, course correct:

> "You don't need to read `config/webpack.js` — that's unrelated. Just focus on `src/app.ts`."

Catching unnecessary reads early saves tokens before they accumulate.

### Use Compact Responses Where Possible

For tasks where you don't need a full explanation, say so:

> "Fix the bug. No need to explain the reasoning — just show me the diff."

This reduces the prose Claude generates in its response, which also consumes output tokens.

---

## When Codex-Style Thinking Helps

Even with Claude Code, sometimes the Codex mindset — **small, targeted, stateless** — is the right tool for the job.

For repetitive, mechanical transforms (rename a variable across 50 files, convert callback syntax to promises), you may be better off writing a small script or using a find-and-replace tool rather than asking Claude to do it agentically. Claude adds the most value when the task requires **judgment and reasoning**, not brute-force repetition.

Matching the tool to the task size is its own form of token efficiency.

---

## Summary

Claude Code is a fundamentally different beast from Codex. Its agentic, context-accumulating design makes it dramatically more capable — and dramatically more token-hungry. Understanding that difference is the first step to working with it sustainably.

The practices that matter most:

- **Short, focused sessions** — one task, then clear or restart
- **Specific requests** — eliminate ambiguity, reduce exploration
- **Paste snippets** instead of letting Claude find them
- **Use `/clear`** between unrelated tasks
- **Invest in CLAUDE.md** to avoid repeating context
- **Break large tasks** into small, independent sessions

Once I started treating Claude Code like a sharp surgical tool rather than an open-ended chatbot, both the quality of output and the token efficiency improved significantly.

---

*Running out of tokens is frustrating, but it's usually a signal that the session has gotten too broad, too long, or too ambiguous. Treat each rate-limit hit as a chance to refine how you frame the next request.*
