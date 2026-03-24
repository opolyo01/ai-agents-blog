---
title: "I Replaced My n8n Workflows and LangChain Scripts With a Markdown File"
date: "2026-03-23"
slug: "i-replaced-my-n8n-workflows-and-langchain-scripts-with-a-markdown-file"
summary: "After building the same release-notes pipeline in n8n and LangChain, I replaced both with a single skill markdown file and compared the trade-offs."
---

## The Setup

I had a release notes pipeline. It started as an n8n workflow - about 15 nodes wired together: GitLab API calls, Jira enrichment, an AI agent node, Readme.com publishing, Slack notifications. It worked. It took a few days to build, debug the node connections, and get the data flowing right.

Then I rewrote it in Python with LangChain and AWS Bedrock. About 450 lines of code. Requirements.txt, pip installs, argparse, dotenv, error handling, logging. Another couple of days. It was faster and more deterministic than n8n, but now I had code to maintain.

Then I tried something different. I wrote a markdown file describing what the pipeline does - every API call, every data transformation, every output format - and pointed an AI agent at it.

It just worked.

## What a "Skills-Only" Agent Looks Like

Here's the entire architecture:

```text
.kiro/skills/release-notes-skills-only.md    <- the "code"
.kiro/agents/mando-release-notes-skills-only.json  <- agent config (10 lines)
.kiro/agents-md/.../AGENTS.md                <- agent instructions (20 lines)
```

The skill file is a structured markdown document. It describes:

- What API endpoints to call (GitLab, Jira, Readme.com, Slack)
- What headers and auth to use
- How to filter and transform the data (with example `jq` commands)
- What the AI should generate (the exact prompt from the original n8n workflow)
- What to do with the output (publish, notify, save)
- How to handle errors

The agent reads this file, then executes each step using shell commands (`curl`, `glab api`, `jq`) and its own reasoning. No Python runtime. No node_modules. No Docker. No workflow engine.

I did the same thing with a Datadog analytics workflow - error tracking, RUM searches, dashboard queries. Another n8n workflow with MCP tools and custom API wrappers. Replaced it with one markdown file.

## Why This Is Compelling

### Zero dependencies

The n8n version needs n8n running (self-hosted or cloud), credentials configured in the UI, workflow JSON imported. The LangChain version needs Python 3.11+, pip, langchain-aws, requests, python-dotenv, AWS credentials for Bedrock.

The skills-only version needs... a text editor. The skill file is plain markdown. The agent config is 10 lines of JSON. Drop them in any repo and you're done.

### Portability across teams

This is the real killer. If I want another team to use my release notes pipeline:

- n8n: Export workflow JSON, import it on their instance, configure credentials, hope the node versions match
- LangChain: Share the Python script, have them install dependencies, set up AWS Bedrock access, debug their Python environment
- Skills-only: Copy one markdown file into their `.kiro/skills/` folder. Done.

The skill file IS the documentation AND the implementation. There's nothing else to ship.

### The AI handles the glue code

In n8n, I spent most of my time wiring nodes together - mapping outputs to inputs, handling edge cases in Code nodes, debugging data transformations. In LangChain, I wrote regex parsers, JSON transformers, error handlers.

With the skills-only approach, the AI handles all of that. I describe what I want in the skill file, and the agent figures out how to pipe `curl` output through `jq`, how to loop over results, how to handle a 404 from Jira gracefully. The glue code that takes 60% of development time just... disappears.

### Modification is trivial

Want to add a new field from Jira? In n8n, I'd open the workflow editor, find the right node, modify the mapping, test it. In LangChain, I'd edit the Python function, test locally, commit. With the skill file, I add a line to the markdown: "Also extract `fields.priority.name` from the Jira response." Next run, it's there.

## The Honest Cons

I wouldn't be writing this if I didn't also hit the walls. Here's where this approach falls short.

### Non-deterministic output

This is the big one. The LangChain script produces identical output every time (same input -> same output). The skills-only agent might format things slightly differently between runs. The release notes content varies. The `jq` commands it constructs might differ. If you need byte-for-byte reproducibility, this isn't it.

For release notes, I don't care - the content is AI-generated anyway. For a pipeline that feeds into another system expecting exact schemas, this could be a problem.

### Slower execution

The Python script runs the whole pipeline in 15-20 seconds. The skills-only agent takes 60-90 seconds because it's making individual tool calls, reasoning between steps, and sometimes re-reading its own output. For a workflow that runs once a week, who cares. For something running in a CI pipeline on every commit, the latency adds up.

### Token cost

Every run consumes AI tokens. The Python script calls Bedrock once for the actual generation. The skills-only agent uses tokens for every step - reading the skill, planning, executing shell commands, parsing results, generating notes, publishing. It's maybe 5-10x more tokens per run. At current pricing that's still cheap for occasional use, but it's not free.

### Debugging is harder

When the Python script fails, I get a stack trace with a line number. When the skills-only agent fails, I get... a conversation log. Sometimes the agent misinterprets a step. Sometimes it constructs a bad `curl` command. The feedback loop is less precise than traditional debugging.

### You're trusting the AI to follow instructions

The skill file says "save to `scripts/releaseNotesLangChain/release_notes/`" - but the agent might save to the repo root instead (this actually happened during testing). The skill file says "source the .env file first" - but the agent might skip it and then complain that credentials are missing (also happened). You need to be very explicit and sometimes redundant in your instructions.

With code, the computer does exactly what you wrote. With a skill file, the AI does approximately what you described. That gap matters.

### No unit tests

I can write tests for the Python script. I can test the n8n workflow with sample data. How do you test a markdown file? You run the agent and see if it works. There's no `pytest` for skills. If someone edits the skill file and breaks a step, you find out at runtime.

## When to Use What

After building the same pipeline three ways, here's my honest take:

Use n8n when you want a visual workflow that non-developers can understand and modify. It's great for teams where the person maintaining the automation isn't a programmer.

Use LangChain/scripts when you need deterministic, testable, fast execution. When the pipeline runs in CI. When you need exact output formats. When you want traditional debugging.

Use skills-only agents when you want maximum portability and minimum setup. When the workflow is used occasionally (not thousands of times a day). When you want to share automation across teams without shipping code. When you're okay with "approximately correct" instead of "exactly reproducible."

## The Bigger Picture

What surprised me most is how little code is actually needed for most automation workflows. The n8n workflow had 15 nodes. The Python script was 450 lines. The skill file is about 200 lines of markdown - and half of that is example `curl` commands that the agent could probably figure out on its own.

Most of what we write in automation pipelines is glue: parsing JSON, mapping fields, handling errors, formatting output. An AI agent that can read documentation and execute shell commands handles all of that implicitly.

I'm not saying skills-only agents replace everything. But for internal tooling, developer workflows, and team automation - the kind of stuff that lives in a `.kiro/` folder and gets shared via git - it's a surprisingly effective approach.

The best part? When the Datadog API changes, I update one line in a markdown file instead of debugging a broken n8n node or updating a Python library.

The worst part? Sometimes the agent saves the file in the wrong directory and you have to add "NEVER save to the repo root" in bold to your skill file. Welcome to the future.
