---
title: "Kafka CDC Basics: WAL, Debezium, CDC, and Avro"
date: "2026-03-16"
slug: "kafka-cdc-basics"
summary: "A simple guide to the core building blocks behind Postgres-to-Kafka CDC pipelines."
---

# Kafka CDC Basics: WAL, Debezium, CDC, Avro

This guide explains the core concepts behind a real-time data pipeline using Postgres and Kafka.

---

# 1. WAL (Write-Ahead Log)

**Definition:**
The WAL is an internal Postgres log that records every change before it is applied to the database.

**Mental model:**

```
Database = current state
WAL = history of all changes
```

**Example:**

```sql
UPDATE users SET email = 'x' WHERE id = 1;
```

WAL records:

```
"row id=1 changed from A → B"
```

**Why it exists:**

* crash recovery
* replication
* enables CDC

---

# 2. CDC (Change Data Capture)

**Definition:**
CDC is a technique to turn database changes into event streams.

**Without CDC:**

```
Service polls database ❌
```

**With CDC:**

```
Database change → event stream ✅
```

**In practice:**

```
INSERT users
   ↓
WAL
   ↓
CDC reads it
   ↓
Kafka event
```

---

# 3. Debezium

**Definition:**
Debezium is a connector that reads database logs (like WAL) and publishes changes to Kafka.

**Pipeline:**

```
Postgres WAL → Debezium → Kafka
```

**What Debezium does:**

1. Connects to Postgres replication stream
2. Reads WAL changes
3. Converts them into structured events
4. Sends them to Kafka topics

**Example event:**

```json
{
  "before": null,
  "after": { "id": 5, "email": "user@email.com" },
  "op": "c"
}
```

**Operation types:**

* `r` = snapshot (initial load)
* `c` = create (INSERT)
* `u` = update
* `d` = delete

---

# 4. Avro

**Definition:**
Avro is a compact binary data format with an explicit schema.

## JSON vs Avro

### JSON

```json
{"id": 5, "email": "x"}
```

* human-readable ✅
* flexible ✅
* larger size ❌
* no strict schema ❌

### Avro

```
(binary data) + schema stored separately
```

* compact ✅
* fast ✅
* strongly typed ✅
* requires Schema Registry ⚠️

**Why Avro failed initially:**

* requires Schema Registry service
* not running locally → connection error

**Solution used:**

* switched to JSON for simplicity

---

# 5. Full Pipeline Overview

```
[1] Postgres update
        ↓
[2] WAL records change
        ↓
[3] Debezium reads WAL (CDC)
        ↓
[4] Event created (JSON or Avro)
        ↓
[5] Kafka stores event in topic
        ↓
[6] Consumers read event
```

---

# 6. Key Takeaways

* **WAL** = raw change log inside database
* **CDC** = turning DB changes into events
* **Debezium** = tool that reads WAL and emits events
* **Kafka** = durable event log
* **Avro** = efficient format (optional, needs extra infra)

---

# 7. Why This Matters

Traditional approach:

```
Service → query database
```

Event-driven approach:

```
Database change → Kafka event → multiple consumers
```

Benefits:

* real-time data flow
* decoupled systems
* scalable architecture

---

# 8. What Comes Next

Raw CDC events are database-focused and noisy.

Next step in real systems:

```
Kafka (CDC raw) → Flink → clean business events → protobuf → consumers
```

Example transformation:

From CDC:

```json
{"after": {"id": 5, "email": "x"}, "op": "c"}
```

To business event:

```json
{"user_id": 5, "email": "x", "event": "UserCreated"}
```

---

# Final Mental Model

```
WAL → CDC → Debezium → Kafka → Consumers
```

This is the foundation of modern real-time data systems.
