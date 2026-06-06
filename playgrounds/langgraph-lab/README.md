# LangGraph Lab

A separate sandbox for learning LangGraph and LangChain concepts without mixing experimental code into the blog app.

## Goal

Use this folder to:

- try small LangGraph workflows
- explore LangChain model and tool abstractions
- keep notes on what feels useful vs overengineered
- turn those notes into a future blog post

## Why this is separate

The Next.js blog should stay clean and publishable.

This folder is for:

- rough experiments
- API exploration
- scripts that may get thrown away
- notes that eventually become polished posts

## Suggested workflow

1. Run the smallest possible graph.
2. Add one concept at a time:
   - state
   - edges
   - tool calls
   - memory / checkpointing
3. Write down:
   - what clicked
   - what felt awkward
   - what seems useful in production
4. Promote the useful parts into a blog post.

## Setup

### Option A: uv

```bash
cd playgrounds/langgraph-lab
uv sync
uv run python scripts/00_hello_graph.py
uv run python scripts/02_langchain_prompt_chain.py
uv run python scripts/03_conditional_graph.py
```

### Option B: venv + pip

```bash
cd playgrounds/langgraph-lab
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
python scripts/00_hello_graph.py
python scripts/02_langchain_prompt_chain.py
python scripts/03_conditional_graph.py
```

The first four scripts are intentionally provider-free. You can explore core concepts
without setting an API key or paying for model calls.

## Files

- `scripts/00_hello_graph.py`
  The smallest possible LangGraph hello-world graph.
- `scripts/01_memory_graph.py`
  A tiny graph compiled with an in-memory checkpointer.
- `scripts/02_langchain_prompt_chain.py`
  A minimal LangChain pipeline showing prompt composition without a real model.
- `scripts/03_conditional_graph.py`
  A LangGraph routing example showing when an explicit graph starts to make sense.
- `notes/learning-log.md`
  Ongoing notes while you experiment.
- `notes/blog-post-outline.md`
  A template for converting learnings into a post.
- `.env.example`
  Placeholder env vars if you later add provider-backed experiments.

## What to explore next

- graph state vs plain function composition
- conditional edges
- tool-calling loops
- checkpointing and thread IDs
- provider-backed model calls after the offline examples feel clear
- what LangGraph solves that plain LangChain does not
- where the complexity is justified and where it is not

## Suggested progression

1. `00_hello_graph.py`
   Learn the basic node and edge shape.
2. `02_langchain_prompt_chain.py`
   See what plain LangChain composition already gives you.
3. `03_conditional_graph.py`
   Compare routing in LangGraph vs plain chain composition.
4. `01_memory_graph.py`
   Add checkpointing and thread-oriented thinking.
5. Write one session in `notes/learning-log.md`
   Convert implementation details into takeaways while they are still fresh.

## References

These scripts are intentionally aligned with the official docs, not random examples:

- LangGraph overview: https://docs.langchain.com/oss/python/langgraph
- LangGraph install: https://docs.langchain.com/oss/python/langgraph/install
- LangGraph quickstart: https://docs.langchain.com/oss/python/langgraph/quickstart
- LangGraph memory: https://docs.langchain.com/oss/python/langgraph/add-memory
- LangChain install: https://docs.langchain.com/oss/python/langchain/install
