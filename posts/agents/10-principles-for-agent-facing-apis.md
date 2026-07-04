---
title: "10 Principles for Designing Agent-Facing APIs"
date: "2026-07-03"
slug: "10-principles-for-agent-facing-apis"
summary: "A model for CLIs and APIs meant to be consumed by AI agents rather than humans, plus a browser-automation benchmark that shows what happens when you ignore it: 12,224 tokens and a dozen tool calls versus one."
---

Most CLIs and APIs were designed for a human reading a terminal, one command at a time, with a person around to notice when output is bloated or a prompt hangs.
An agent calling the same interface has none of that.
It pays for every token in the response, it can't answer an interactive prompt, and it can't skim past ten irrelevant fields to find the one it needs.

Below is a model for designing interfaces for that second audience: 10 principles, followed by a concrete benchmark that shows what's at stake when you don't apply them.

## The 10 principles

1. **Token-efficient output.** Prefer compact, low-overhead formats like TOON over JSON for large uniform lists, where the token savings (commonly cited around 40%) are real. For deeply nested or irregular data, plain JSON is usually the safer default, since models have seen vastly more of it in training.
2. **Minimal default schemas.** Return 3-4 fields per list item, not 10+. An agent that needs more can ask for it; an agent drowning in unused fields on every call just burns tokens.
3. **Content truncation.** Truncate large text fields, but do it with a visible size hint and an explicit escape hatch, so the agent knows there's more and knows how to get it.
4. **Pre-computed aggregates.** Include counts and statuses the agent would otherwise have to compute itself across several round trips.
5. **Definitive empty states.** Return an explicit "0 results," never an ambiguous empty array or blank string that could just as easily mean "the query failed."
6. **Structured errors and exit codes.** Mutations should be idempotent, errors should be structured and parseable, and nothing should ever block on an interactive prompt.
7. **Ambient context.** Install opt-in session integrations first, so common context is already loaded, then expose an on-demand skill for anything deeper.
8. **Content first.** Default to showing the actual data an agent asked for, not a wall of help text it has to parse to find the data.
9. **Contextual disclosure.** Append relevant next-step commands after the output, once the agent has the context to know which ones matter, rather than dumping every possible option upfront.
10. **A consistent way to get help.** A concise, per-subcommand reference an agent can query on demand, instead of a single giant help page for the whole tool.

## What ignoring this costs: a browser-automation benchmark

The clearest illustration I've seen of why this matters is a benchmark comparing three ways to do the same browser task: "Find designer of Rust, its GitHub stars, and tagline across three sites."

- **AXI**: 1 turn, 6,558 tokens, 1.6s. A single `--help | head` style call does the whole task.
- **CLI (agent-browser)**: 1 turn, 6,501 tokens, 1.6s. Same shape: one command, one response.
- **MCP (chrome-devtools-mcp)**: 12,224 tokens, 1.6s, spread across a long chain of tool calls: `new_page`, `take_snapshot`, `select_page`, `evaluate_script`, `new_page` again, `take_snapshot` again, `select_page` again, and so on.

Same task, same wall-clock time, roughly double the tokens, and an order of magnitude more turns for the MCP path. That gap isn't a model capability problem. It's principle 4 and principle 1 showing up directly in the bill: the MCP tool surface makes the agent assemble its own aggregate result one snapshot and one page-select at a time, instead of returning it pre-computed in a single response.

None of the 10 principles are exotic. Most of them are just "think about the caller" applied to a caller that happens to be a model instead of a person. The benchmark above is what it looks like when a tool surface skips that step: correct answers, same latency, but every extra turn is an extra round trip of context the agent has to carry, and every extra field is tokens spent on data nobody asked for.
