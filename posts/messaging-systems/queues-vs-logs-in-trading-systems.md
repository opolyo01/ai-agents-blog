---
title: "Queues vs Logs in Trading Systems"
date: "2026-03-17"
slug: "queues-vs-logs-in-trading-systems"
summary: "Kafka, SQS, Solace, AMPS, kdb+ explained — queues distribute work, logs distribute truth. How to pick the right model for trading UIs and real-time systems."
---

# Queues vs Logs in Trading Systems
### (Kafka, SQS, Solace, AMPS, kdb+ explained)

When building trading systems or real-time UIs (blotters, order entry, market data), one of the most important architectural decisions is:

> **Are you moving work… or are you moving events?**

This distinction leads to two fundamentally different models:

- **Queues → distribute work**
- **Logs → distribute information**

Let's break this down and map it to real systems like Kafka, SQS, Solace, AMPS, and kdb+.

---

## 1. Queue Model (Work Distribution)

### Flow

```
Publisher → Queue → Worker
```

### How it works
- Messages are sent to a queue
- Workers pull and process them
- Message is removed after processing

### Properties
- Each message is processed **once**
- Load is **distributed across workers**
- No history after consumption
- No replay

### Mental model
> "Give this task to someone"

### Examples
- AWS SQS
- RabbitMQ
- Celery / Sidekiq

### Trading use cases
- Order execution tasks
- Risk checks
- Async workflows

---

## 2. Log Model (Event Streaming)

### Flow

```
Producer → Log → Consumers (many)
```

### How it works
- Events are appended to a log (immutable)
- Consumers read independently
- Messages are **not deleted**

### Properties
- Replayable history
- Multiple consumers
- Consumers control offsets
- Durable event store

### Mental model
> "This happened — anyone can read it"

### Examples
- Kafka
- Kinesis
- Pulsar

### Trading use cases
- Market data streams
- Trades and fills
- Audit logs
- UI state reconstruction

---

## Core Difference

| Feature | Queue | Log |
|--------|------|-----|
| Consumption | One consumer | Many consumers |
| Retention | Deleted | Stored |
| Replay | No | Yes |
| Use case | Work | Events |
| Control | System | Consumer |

---

## Where Common Systems Fit

| System | Type | Reality |
|------|------|--------|
| **SQS** | Queue | Pure work queue |
| **Kafka** | Log | Event streaming platform |
| **Solace** | Hybrid | Broker (queue + pub/sub) |
| **AMPS** | Hybrid | Streaming + state |
| **kdb+** | Log-like | Time-series database |

---

## 3. Solace — Broker (Queue + Pub/Sub)

### What it is
- Message broker (like RabbitMQ, but more advanced)
- Supports:
  - Queues (work)
  - Topics (pub/sub)

### Behavior
- Queue mode → acts like SQS
- Topic mode → pub/sub (but not a true log)

### Key traits
- Very low latency
- Push-based delivery
- No native replay like Kafka

### So why not just use Solace for everything?

It's a fair question. Solace does queues *and* pub/sub, so it looks like it covers both models. In practice, it doesn't replace either one cleanly:

- **No durable log.** Solace delivers messages and they're gone. If a consumer wasn't connected, or you need to replay last Tuesday's trades, you're out of luck. Kafka keeps the full history — Solace doesn't.
- **No consumer-controlled offsets.** In Kafka, each consumer tracks its own position in the log. You can rewind, re-process, or spin up a new consumer that starts from the beginning. Solace pushes messages as they arrive — once delivered, the broker moves on.
- **Fan-out has limits.** Solace topics do broadcast to multiple subscribers, but each subscriber gets the *current* stream. A late joiner misses everything before it connected. Kafka consumers can catch up from any point in time.
- **Scaling consumers is different.** Adding more Kafka consumers in a group means partitions get rebalanced automatically. Solace scaling depends on queue bindings and broker capacity — it works, but it's a different operational model.
- **No queryable state.** AMPS gives you SOW (State of the World) — ask "what are my current positions?" and get an answer without replaying anything. Solace has no equivalent.

Solace is excellent at what it does: **ultra-low-latency message routing**. It's the right choice when you need to get a message from A to B in microseconds and don't need history. But "hybrid" doesn't mean "universal." It's a fast broker, not an event store and not a state engine.

In most trading architectures, Solace handles the hot path (real-time delivery) while Kafka or kdb+ handles the cold path (history, replay, analytics). They complement each other — they don't replace each other.

### Trading usage
- Market data fan-out
- Order routing
- Low-latency messaging

### Mental model
> "Route messages to the right place fast"

---

## 4. AMPS — Streaming + Stateful

### What it is
A trading-focused system combining:
- Pub/Sub
- Persistence
- Queryable state

### Key concept: SOW (State of the World)

Instead of replaying events:
- You can query the **latest state directly**

### Behavior
- Supports replay
- Maintains current snapshot
- Combines streaming + storage

### Trading usage
- Blotters
- Positions
- Order books

### Mental model
> "Give me the current state + updates"

---

## 5. kdb+ — Time-Series Engine (Not Messaging)

### What it is
- High-performance time-series database
- Widely used in hedge funds

### Architecture
- Tickerplant = append-only event stream
- Data stored for historical analysis

### Behavior
- Not a queue
- Not a broker
- Acts like a **log + database**

### Trading usage
- Historical market data
- Backtesting
- Quant analytics

### Mental model
> "Store everything and query it instantly"

---

## The Real Architecture Pattern

Modern trading systems don't pick one — they combine them.

### Classic hedge fund setup

```
Feed Handler → Solace / AMPS → UI / Risk
                    ↓
                   kdb+
```

### Modern approach

```
Exchange → Kafka → Consumers → UI / DB / Analytics
```

---

## Subtle but Important Differences

### Kafka vs Solace
- Kafka → pull-based, replayable
- Solace → push-based, real-time routing

### Kafka vs AMPS
- Kafka → event-first
- AMPS → state-first

### Kafka vs kdb+
- Kafka → transport + log
- kdb+ → storage + analytics

---

## What This Means for Trading UI

### If you use a Queue:
- UI can miss data
- No replay
- Hard to recover state

### If you use a Log:
- UI can replay history
- Safe reconnects
- Scales to many consumers

That's why modern trading UIs are built on **log-based systems (Kafka / AMPS)**.

---

## Final Takeaway

- **Queues distribute work**
- **Logs distribute truth**
- **Brokers route messages**
- **Databases store history**

---

## One-Liner

> **Use queues to do things. Use logs to understand what happened.**

---

## Bonus: Simple Rule of Thumb

| Need | Use |
|-----|----|
| Execute a task | Queue (SQS) |
| Stream events | Log (Kafka) |
| Ultra-low latency routing | Solace |
| Current state + updates | AMPS |
| Historical analytics | kdb+ |

---

If you're building trading systems or real-time UIs, getting this distinction right is the difference between:

- fragile systems

vs

- scalable, replayable, observable platforms
