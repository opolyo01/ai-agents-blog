---
title: "Why the Same Prompt Gives Different Results: LLM Determinism Explained"
date: "2026-06-06"
slug: "llm-determinism-temperature-explained"
summary: "Temperature is just the start. Here is every source of non-determinism in LLMs, how each one works under the hood, and how to engineer around them with real Python code."
category: "AI Engineering"
---

You send the same prompt twice. You get two different answers.

This is not a bug. It is by design. But if you are building a production system — a fraud classifier, a document parser, a structured data extractor — non-determinism is a problem you need to understand and control.

Here is everything you need to know.

---

## 1. Temperature — The Primary Cause

Every LLM generates text one token at a time. At each step, the model produces a probability distribution over its entire vocabulary — tens of thousands of possible next tokens. Temperature controls how you sample from that distribution.

| Temperature | Behavior |
|---|---|
| `0` | Always picks the highest probability token — same input, same output every time |
| `0.7` | Most LLM API defaults — some randomness, some consistency |
| `1` | Samples proportionally from the distribution — same input, different output each time |
| `2` | Flattens the distribution almost to uniform — nearly random output |

Concretely, given token probabilities for the next word after `"The payment is"`:

| Token | Probability |
|---|---|
| `"approved"` | 0.72 |
| `"pending"` | 0.18 |
| `"declined"` | 0.07 |
| `"complete"` | 0.03 |

- **temperature=0** → always `"approved"`
- **temperature=1** → `"approved"` ~72% of the time, others occasionally
- **temperature=2** → all four nearly equally likely

The math: divide each logit by temperature before applying softmax. Low temperature sharpens the peak. High temperature flattens it.

```python
import numpy as np

def apply_temperature(logits: np.ndarray, temperature: float) -> np.ndarray:
    """Scale logits by temperature then softmax."""
    if temperature == 0:
        # Greedy — return one-hot at argmax
        probs = np.zeros_like(logits)
        probs[np.argmax(logits)] = 1.0
        return probs
    scaled = logits / temperature
    # Subtract max for numerical stability
    scaled -= scaled.max()
    exp_scaled = np.exp(scaled)
    return exp_scaled / exp_scaled.sum()

logits = np.array([2.5, 1.2, 0.8, 0.3])  # raw model output

for temp in [0, 0.5, 1.0, 2.0]:
    probs = apply_temperature(logits, temp)
    print(f'temperature={temp}: {np.round(probs, 3)}')

# temperature=0:   [1.    0.    0.    0.   ]
# temperature=0.5: [0.924 0.063 0.012 0.001]
# temperature=1.0: [0.685 0.201 0.087 0.028]
# temperature=2.0: [0.453 0.271 0.191 0.085]
```

---

## 2. Other Sources of Non-Determinism

Temperature is not the only variable. Even with `temperature=0`, you can still get different outputs.

### top_p — Nucleus Sampling

Instead of sampling from the full vocabulary, restrict to the smallest set of tokens whose cumulative probability reaches `p`.

```python
def nucleus_sample(probs: np.ndarray, top_p: float) -> int:
    """Sample from the nucleus — tokens summing to top_p probability."""
    sorted_indices = np.argsort(probs)[::-1]
    sorted_probs = probs[sorted_indices]
    cumulative = np.cumsum(sorted_probs)

    # Keep only tokens inside the nucleus
    cutoff = np.searchsorted(cumulative, top_p) + 1
    nucleus_indices = sorted_indices[:cutoff]
    nucleus_probs = probs[nucleus_indices]
    nucleus_probs /= nucleus_probs.sum()  # renormalize

    return np.random.choice(nucleus_indices, p=nucleus_probs)

probs = np.array([0.5, 0.25, 0.15, 0.07, 0.03])
# top_p=0.9 → considers first 3 tokens (0.5+0.25+0.15=0.90)
# top_p=1.0 → considers all tokens
```

`top_p=0.9` cuts off the long tail of low-probability tokens. Still non-deterministic — you are still sampling — but the output space is constrained.

### top_k — Fixed Token Count

Only consider the top K tokens at each step. Simpler than `top_p`, less adaptive.

```python
def top_k_sample(probs: np.ndarray, k: int) -> int:
    """Sample from the top-k tokens only."""
    top_k_indices = np.argsort(probs)[-k:]
    top_k_probs = probs[top_k_indices]
    top_k_probs /= top_k_probs.sum()
    return np.random.choice(top_k_indices, p=top_k_probs)
```

### Floating Point Non-Determinism

GPU matrix multiplication is not fully deterministic. Operations are parallelized across thousands of cores, and floating point addition is not associative — `(a + b) + c ≠ a + (b + c)` at float32 precision.

```
Same prompt + temperature=0 + different GPU hardware
→ slightly different logits
→ different token chosen at one step
→ completely different output by the end (butterfly effect)
```

This is why the OpenAI `seed` parameter is a reproducibility *hint*, not a guarantee.

### System Prompt Drift

If your system prompt includes dynamic content — timestamps, user context, session IDs — every call has a different context. Even one different token changes downstream probabilities.

```python
import datetime

# Bad — system prompt changes every second
system_prompt = f"Today is {datetime.datetime.now()}. You are a helpful assistant."

# Good — static system prompt
system_prompt = "You are a helpful assistant."

# If date context is needed, pass it in a controlled, normalized way
system_prompt = f"Today is {datetime.date.today()}. You are a helpful assistant."
#                           ^^^^^^^^^^^^^^^^^^^^^^^^
#                           Changes once per day, not every call
```

### Model Version Updates

`gpt-4-turbo-0125` and `gpt-4-turbo-1106` are different model weights. Same prompt, different output.

```python
# Pin the model version explicitly
client.chat.completions.create(
    model="gpt-4-turbo-0125",   # pinned — predictable
    # model="gpt-4-turbo",      # alias — can change under you
    ...
)
```

### Context Window History

Every token in the conversation shifts the probability distribution for the next token. Adding a single extra message — or a longer previous response — changes everything downstream.

---

## 3. Practical Fixes — Four Levels

### Level 1 — API Parameters

The simplest lever: set `temperature=0` and use the `seed` parameter where available.

```python
import openai

client = openai.OpenAI()

response = client.chat.completions.create(
    model="gpt-4-turbo-0125",
    temperature=0,       # greedy decoding
    seed=42,             # reproducibility hint (OpenAI)
    top_p=1,             # disable nucleus sampling
    messages=[
        {"role": "system", "content": "You are a document classifier."},
        {"role": "user", "content": "Classify this document: ..."}
    ]
)

# Check the system fingerprint — if it changes, the model changed
print(response.system_fingerprint)
```

For Anthropic's Claude:

```python
import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-opus-4-5",
    max_tokens=1024,
    temperature=0,       # supported on Claude too
    messages=[
        {"role": "user", "content": "Classify this document: ..."}
    ]
)
```

### Level 2 — Constrain the Output Shape

Free text invites variation. Structured output eliminates it.

```python
# Bad — open-ended response
response = client.chat.completions.create(
    model="gpt-4-turbo-0125",
    temperature=0,
    messages=[{"role": "user", "content": "Is this transaction fraudulent? Answer yes or no."}]
)
# → "Yes", "No", "I believe so", "It appears to be fraudulent", "Likely yes"

# Good — JSON mode
response = client.chat.completions.create(
    model="gpt-4-turbo-0125",
    temperature=0,
    response_format={"type": "json_object"},
    messages=[
        {"role": "system", "content": "Output JSON only."},
        {"role": "user", "content": "Is this transaction fraudulent? Return {\"fraudulent\": bool, \"confidence\": float, \"reason\": str}"}
    ]
)
# → always {"fraudulent": true, "confidence": 0.94, "reason": "Unusual amount for merchant category"}

# Better — function calling / tool use (most structured)
tools = [{
    "type": "function",
    "function": {
        "name": "classify_transaction",
        "parameters": {
            "type": "object",
            "properties": {
                "fraudulent": {"type": "boolean"},
                "confidence": {"type": "number", "minimum": 0, "maximum": 1},
                "reason": {"type": "string", "maxLength": 100}
            },
            "required": ["fraudulent", "confidence", "reason"]
        }
    }
}]

response = client.chat.completions.create(
    model="gpt-4-turbo-0125",
    temperature=0,
    tools=tools,
    tool_choice={"type": "function", "function": {"name": "classify_transaction"}},
    messages=[{"role": "user", "content": "Classify: $4,200 charge at a gas station, card never used internationally before."}]
)

import json
result = json.loads(response.choices[0].message.tool_calls[0].function.arguments)
print(result)
# {"fraudulent": true, "confidence": 0.87, "reason": "Unusual amount for merchant category"}
```

### Level 3 — Prompt Engineering

Constrained prompts produce more consistent output than open-ended ones.

```python
import json
import openai
from pydantic import BaseModel
from typing import List

client = openai.OpenAI()  # reads OPENAI_API_KEY from environment

# Bad — vague, many valid interpretations
bad_prompt = "Analyze this payment and tell me if something looks wrong."

# Good — system instruction separate from user input
SYSTEM_PROMPT = """You are a fraud detection classifier.
Return ONLY a JSON object with these exact fields:
- fraudulent: boolean
- confidence: float between 0 and 1
- flags: list of strings, each max 5 words
- reason: string, max 15 words

Do not include any explanation, preamble, or text outside the JSON object."""

# Verify output structure in your code, not just in the prompt
class FraudResult(BaseModel):
    fraudulent: bool
    confidence: float
    flags: List[str]
    reason: str

def classify(transaction: str) -> FraudResult:
    response = client.chat.completions.create(
        model="gpt-4-turbo-0125",
        temperature=0,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Classify this transaction: {transaction}"}
        ]
    )
    raw = json.loads(response.choices[0].message.content)
    return FraudResult(**raw)  # will raise ValidationError if schema is wrong

# Usage
result = classify("$4,200 charge at a gas station, card never used internationally before.")
print(result)
# FraudResult(fraudulent=True, confidence=0.87, flags=['unusual amount', 'new location'], reason='High amount at gas station, no travel history')
```

### Level 4 — Architectural

The most robust fix: do not use the LLM for decisions that need to be deterministic. Use it only for explanation.

```python
import joblib
import numpy as np

# Deterministic components — no LLM involved
fraud_model = joblib.load('fraud_model.pkl')      # sklearn / XGBoost
db = get_postgres_connection()

def process_transaction(tx: dict) -> dict:
    # --- Deterministic layer ---
    features = extract_features(tx)                # pure function
    fraud_score = fraud_model.predict_proba([features])[0][1]  # ML model
    vendor = db.query("SELECT * FROM vendors WHERE id = %s", tx['vendor_id'])
    limit = db.query("SELECT limit FROM rules WHERE merchant_category = %s", vendor['category'])

    decision = {
        "approved": fraud_score < 0.7 and tx['amount'] <= limit['value'],
        "fraud_score": round(float(fraud_score), 4),
        "amount": tx['amount'],
        "vendor": vendor['name'],
    }

    # --- LLM layer — only for human-readable explanation ---
    # Non-determinism here is fine, even desirable
    explanation_prompt = f"""
    A payment was {'approved' if decision['approved'] else 'declined'}.
    Fraud score: {decision['fraud_score']}
    Amount: ${decision['amount']}
    Vendor: {decision['vendor']}

    Write a one-sentence explanation for the customer. Be clear and professional.
    """
    explanation_response = client.chat.completions.create(
        model="gpt-4-turbo-0125",
        temperature=0.3,   # slight variation is fine for natural language
        messages=[{"role": "user", "content": explanation_prompt}]
    )
    decision["explanation"] = explanation_response.choices[0].message.content.strip()

    return decision
```

The LLM never touches the decision. It only explains one that was already made by deterministic systems.

---

## 4. Testing for Determinism

If you need to verify that your pipeline is sufficiently stable, run the same input multiple times and measure variance.

```python
from collections import Counter
import json

def measure_stability(prompt: str, n: int = 20, temperature: float = 0) -> dict:
    """Run the same prompt n times and measure output consistency."""
    results = []
    for _ in range(n):
        response = client.chat.completions.create(
            model="gpt-4-turbo-0125",
            temperature=temperature,
            response_format={"type": "json_object"},
            messages=[{"role": "user", "content": prompt}]
        )
        results.append(response.choices[0].message.content)

    counts = Counter(results)
    most_common, most_common_count = counts.most_common(1)[0]

    return {
        "runs": n,
        "unique_outputs": len(counts),
        "consistency_rate": most_common_count / n,
        "most_common_output": json.loads(most_common),
        "all_outputs": dict(counts)
    }

stats = measure_stability(
    prompt='Classify sentiment. Return {"sentiment": "positive"|"negative"|"neutral"}. Text: "The product works great but shipping was slow."',
    n=20,
    temperature=0
)
print(f"Consistency: {stats['consistency_rate']:.0%} ({stats['unique_outputs']} unique outputs in {stats['runs']} runs)")
# Consistency: 100% (1 unique output in 20 runs)  ← ideal
# Consistency: 85%  (3 unique outputs in 20 runs)  ← investigate
```

---

## Summary

| Source | Controllable? | Fix |
|---|---|---|
| Temperature | Yes | Set to 0 |
| top_p / top_k | Yes | Set top_p=1, disable top_k |
| GPU float non-determinism | Partially | Use `seed`, accept residual variance |
| System prompt drift | Yes | Remove dynamic content or normalize it |
| Model version updates | Yes | Pin the model version string |
| Context window history | Yes | Keep conversation history deterministic |
| Output format | Yes | Use JSON mode or function calling |
| Decision logic | Yes | Move decisions out of the LLM entirely |

---

## One Line

> "Temperature controls sampling randomness — set it to zero for consistency, use JSON mode or function calling to constrain output shape, and for truly deterministic decisions like fraud scoring or payment routing, keep the LLM out of the decision path entirely and use it only for explanation."