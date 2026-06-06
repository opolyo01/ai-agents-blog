---
title: "Spark for Full Stack Engineers: ML Data Pipelines from First Principles"
date: "2026-06-06"
slug: "spark-for-full-stack-engineers"
summary: "If you filter, map, and reduce data in JavaScript every day, you already understand Spark DataFrames. Here is what changes when you move from UI data wrangling to distributed ML pipelines."
category: "Data Engineering"
---

# Spark for Full Stack Engineers: ML Data Pipelines from First Principles

If you write JavaScript every day — filtering arrays, mapping over data, grouping things before rendering a UI — you already understand 80% of Spark.

The mental model is identical. The scale is just different.

---

# 1. The Same Operations, Three Runtimes

| JavaScript (UI) | Pandas (single machine) | Spark (distributed) |
|---|---|---|
| `array.filter(fn)` | `df[df.age > 30]` | `df.filter(col('age') > 30)` |
| `array.map(fn)` | `df['col'] = df['a'] * 2` | `df.withColumn('col', col('a') * 2)` |
| `array.reduce(fn)` | `df.groupby().sum()` | `df.groupBy().agg(sum())` |
| `[...a, ...b]` | `pd.concat([a, b])` | `a.union(b)` |
| `a.forEach(print)` | `df.head()` | `df.show()` |

Same concepts. Different APIs. Different scale.

**When to use which:**

- JS: UI state, client-side filtering, small in-memory data
- Pandas: single machine, fits in RAM, exploratory analysis
- Spark: distributed cluster, data larger than RAM, production data pipelines

Rule of thumb: Pandas for under 1GB, Spark for over 10GB.

---

# 2. The One Key Difference — Lazy Evaluation

In JavaScript, operations execute immediately left to right:

```javascript
// JS — runs immediately, line by line
const result = data
  .filter(x => x.age > 30)   // runs NOW
  .map(x => x.salary * 1.1)  // runs NOW
  .reduce(...)                // runs NOW
```

In Spark, transformations build a plan. Nothing runs until an action fires:

```python
# Spark — builds a plan, runs NOTHING yet
df = df
  .filter(col('age') > 30)        # plan step 1
  .withColumn('salary_adj', ...)  # plan step 2
  .groupBy('dept').agg(...)       # plan step 3

# NOTHING HAS RUN YET

df.show()  # THIS triggers execution
           # Spark optimizes the whole plan first, then runs it
```

**Transformations** (lazy — build a plan): `filter`, `select`, `withColumn`, `groupBy`, `join`

**Actions** (execute the plan): `show()`, `count()`, `collect()`, `write()`

This is why Spark is fast. It sees your entire query plan before processing a single byte of data, then rewrites it for efficiency using its Catalyst optimizer.

---

# 3. Local Setup — No Cluster Needed

```bash
pip install pyspark pandas numpy
```

Spark runs locally using all your CPU cores. No AWS account, no cluster, no config files.

```python
from pyspark.sql import SparkSession
from pyspark.sql import functions as F

spark = SparkSession.builder \
    .appName('MLPipeline') \
    .master('local[*]') \
    .config('spark.driver.memory', '2g') \
    .getOrCreate()

spark.sparkContext.setLogLevel('ERROR')
print('Cores available:', spark.sparkContext.defaultParallelism)
```

`local[*]` means use all available CPU cores. On a 4-core laptop that is 4 parallel workers. On a real cluster it is hundreds. The same code runs both places — you change one line to point at a real cluster.

Open `http://localhost:4040` in your browser while jobs run. You get a full visual of what Spark is executing, how long each stage took, and how data is partitioned.

---

# 4. DataFrames — The Core Data Structure

A Spark DataFrame is a distributed table. Same concept as a pandas DataFrame or a SQL table, but the rows are split across nodes in a cluster.

```python
from pyspark.sql.types import *

data = [
    (1, 'Alice', 29, 'engineer', 95000.0),
    (2, 'Bob',   34, 'manager',  120000.0),
    (3, 'Carol', 27, 'engineer', 88000.0),
    (4, 'Dave',  45, 'director', 180000.0),
]

schema = StructType([
    StructField('id',     IntegerType(), False),
    StructField('name',   StringType(),  False),
    StructField('age',    IntegerType(),  True),
    StructField('role',   StringType(),   True),
    StructField('salary', DoubleType(),   True),
])

df = spark.createDataFrame(data, schema)
df.show()
df.printSchema()
```

You can also read directly from files:

```python
# CSV
df = spark.read.csv('/path/to/file.csv', header=True, inferSchema=True)

# JSON
df = spark.read.json('/path/to/file.json')

# Parquet (most common in production)
df = spark.read.parquet('/path/to/data.parquet')
```

---

# 5. The Core Operations

```python
# Filter — same as JS .filter()
df.filter(F.col('role') == 'engineer').show()

# Multiple conditions
df.filter(
    (F.col('salary') > 90000) & (F.col('age') < 40)
).show()

# Add or transform a column — same as JS .map()
df.withColumn('salary_k', F.col('salary') / 1000).show()

# Conditional column — same as JS ternary
df.withColumn('level',
    F.when(F.col('salary') > 150000, 'senior')
     .when(F.col('salary') > 100000, 'mid')
     .otherwise('junior')
).show()

# GroupBy + aggregate — same as JS .reduce() to summarize
df.groupBy('role').agg(
    F.count('id').alias('headcount'),
    F.avg('salary').alias('avg_salary'),
    F.max('salary').alias('max_salary'),
    F.min('salary').alias('min_salary')
).show()

# Sort
df.orderBy(F.col('salary').desc()).show()

# Select specific columns
df.select('name', 'role', 'salary').show()

# Drop a column
df.drop('id').show()

# Rename
df.withColumnRenamed('salary', 'annual_pay').show()
```

---

# 6. Handling Missing Data

Missing data is the first real problem in every data pipeline. Spark has clean built-in handling:

```python
# Check for missing values across all columns
missing = df.select([
    F.count(F.when(F.col(c).isNull(), c)).alias(c)
    for c in df.columns
])
missing.show()

# Drop rows with any null
df.dropna().show()

# Drop rows where specific columns are null
df.dropna(subset=['age', 'salary']).show()

# Fill nulls with fixed values
df.fillna({'age': 0, 'role': 'unknown', 'salary': 0.0}).show()

# Fill with computed values (e.g. median age)
median_age = df.approxQuantile('age', [0.5], 0.01)[0]
df.fillna({'age': median_age}).show()
```

---

# 7. A Real ML Data Pipeline — Titanic Dataset

Here is what a full data engineering pipeline looks like — from raw CSV to clean, split, feature-engineered Parquet files ready for model training.

```python
import urllib.request

# Download raw data
url = 'https://raw.githubusercontent.com/datasciencedojo/datasets/master/titanic.csv'
urllib.request.urlretrieve(url, '/tmp/titanic.csv')

df = spark.read.csv('/tmp/titanic.csv', header=True, inferSchema=True)
print(f'Raw rows: {df.count()}, columns: {len(df.columns)}')
```

**Step 1 — Select and clean:**

```python
features = ['Pclass', 'Sex', 'Age', 'SibSp', 'Parch', 'Fare', 'Embarked', 'Survived']
df_clean = df.select(features)

# Fill missing values
median_age = df_clean.approxQuantile('Age', [0.5], 0.01)[0]
df_clean = df_clean.fillna({
    'Age': median_age,
    'Embarked': 'S',
    'Fare': 0.0
})

df_clean = df_clean.dropna()
print(f'Clean rows: {df_clean.count()}')
```

**Step 2 — Encode categoricals:**

```python
df_clean = df_clean \
    .withColumn('Sex_enc',
        F.when(F.col('Sex') == 'male', 1).otherwise(0)) \
    .withColumn('Embarked_enc',
        F.when(F.col('Embarked') == 'S', 0)
         .when(F.col('Embarked') == 'C', 1)
         .otherwise(2)) \
    .drop('Sex', 'Embarked')
```

**Step 3 — Feature engineering:**

```python
df_clean = df_clean \
    .withColumn('FamilySize', F.col('SibSp') + F.col('Parch') + 1) \
    .withColumn('IsAlone',
        F.when(F.col('FamilySize') == 1, 1).otherwise(0)) \
    .withColumn('FareBucket',
        F.when(F.col('Fare') <= 7.91, 0)
         .when(F.col('Fare') <= 14.45, 1)
         .when(F.col('Fare') <= 31.0, 2)
         .otherwise(3))
```

**Step 4 — Split and save:**

```python
df_train, df_test = df_clean.randomSplit([0.8, 0.2], seed=42)

df_train.write.mode('overwrite').parquet('/tmp/titanic_train.parquet')
df_test.write.mode('overwrite').parquet('/tmp/titanic_test.parquet')

print(f'Train: {df_train.count()}, Test: {df_test.count()}')
```

---

# 8. Train a Model with Spark MLlib

Spark has its own ML library. The Pipeline concept mirrors sklearn — a sequence of transformations ending in a model.

```python
from pyspark.ml.feature import VectorAssembler, StandardScaler
from pyspark.ml.classification import RandomForestClassifier
from pyspark.ml.evaluation import BinaryClassificationEvaluator, MulticlassClassificationEvaluator
from pyspark.ml import Pipeline

feature_cols = ['Pclass', 'Sex_enc', 'Age', 'FamilySize', 'IsAlone', 'FareBucket', 'Embarked_enc']

# VectorAssembler combines multiple columns into one features vector
# Spark ML requires this format — it cannot accept individual columns
assembler = VectorAssembler(inputCols=feature_cols, outputCol='features_raw')
scaler = StandardScaler(inputCol='features_raw', outputCol='features', withMean=True, withStd=True)
rf = RandomForestClassifier(featuresCol='features', labelCol='label', numTrees=100, maxDepth=5)

pipeline = Pipeline(stages=[assembler, scaler, rf])

# Spark ML expects a column called 'label'
df_train_ml = spark.read.parquet('/tmp/titanic_train.parquet') \
                   .withColumnRenamed('Survived', 'label')
df_test_ml  = spark.read.parquet('/tmp/titanic_test.parquet') \
                   .withColumnRenamed('Survived', 'label')

model = pipeline.fit(df_train_ml)
predictions = model.transform(df_test_ml)

# Evaluate
auc = BinaryClassificationEvaluator(labelCol='label', metricName='areaUnderROC').evaluate(predictions)
acc = MulticlassClassificationEvaluator(labelCol='label', metricName='accuracy').evaluate(predictions)
print(f'Accuracy: {acc:.3f}, AUC: {auc:.3f}')

# Feature importances
rf_model = model.stages[-1]
importances = sorted(zip(feature_cols, rf_model.featureImportances), key=lambda x: x[1], reverse=True)
for feat, imp in importances:
    print(f'  {feat:20} {imp:.3f}')
```

---

# 9. Parquet — The Format That Matters at Scale

CSV reads every column even when you only need one. Parquet is columnar — it skips columns your query does not touch and only reads the partitions that match your filter.

```python
# Save partitioned by a column
# Creates separate folders per partition value
df.write \
    .mode('overwrite') \
    .partitionBy('task_type') \
    .parquet('/tmp/data.parquet')

# Folder structure:
# /tmp/data.parquet/
#   task_type=transcription/part-000.parquet
#   task_type=sentiment/part-000.parquet
#   task_type=intent/part-000.parquet

# Querying one partition only reads one folder — skips the rest
df_subset = spark.read.parquet('/tmp/data.parquet/task_type=transcription')
```

At large scale, partition pruning is the difference between a 10-second query and a 10-hour one.

**CSV vs Parquet comparison:**

```
CSV:     human-readable, row-based, slow for large data, no compression by default
Parquet: binary, columnar, compressed, fast for analytical queries
         ~5-10x smaller file size
         ~10-100x faster for column-selective queries
```

---

# 10. Window Functions — Advanced Operations

Window functions operate on a group of rows relative to the current row. Essential for rankings, running totals, and time-series pipelines.

```python
from pyspark.sql.window import Window

# Rank users by salary within each department
window_spec = Window.partitionBy('dept').orderBy(F.col('salary').desc())

df_ranked = df.withColumn('rank_in_dept', F.rank().over(window_spec))

# Top 3 earners per department
df_ranked.filter(F.col('rank_in_dept') <= 3).show()

# Running total of salary by hire date
window_running = Window.partitionBy('dept').orderBy('hire_date') \
                       .rowsBetween(Window.unboundedPreceding, 0)

df.withColumn('running_salary_total',
    F.sum('salary').over(window_running)
).show()

# Previous row value (lag)
window_ordered = Window.partitionBy('user_id').orderBy('event_date')
df.withColumn('prev_event', F.lag('event_type', 1).over(window_ordered)).show()
```

---

# 11. Common Data Quality Operations

These patterns appear in every serious data pipeline:

```python
# Deduplication — keep one record per id
df_deduped = df.dropDuplicates(['id'])

# Dedup keeping the most recent record
window_dedup = Window.partitionBy('user_id').orderBy(F.col('updated_at').desc())
df_latest = df.withColumn('rank', F.rank().over(window_dedup)) \
              .filter(F.col('rank') == 1) \
              .drop('rank')

# Outlier detection — flag records outside 3 standard deviations
stats = df.select(
    F.mean('salary').alias('mean'),
    F.stddev('salary').alias('stddev')
).collect()[0]

df_flagged = df.withColumn('is_outlier',
    F.when(
        F.abs(F.col('salary') - stats['mean']) > 3 * stats['stddev'],
        True
    ).otherwise(False)
)

# Data profiling — column statistics in one call
df.select('age', 'salary', 'tenure').describe().show()
```

---

# 12. Cheat Sheet

**Spark core concepts**

| Term | Meaning |
|---|---|
| `DataFrame` | Distributed table, same API as pandas |
| `Transformation` | Lazy operation — builds a plan (`filter`, `select`, `withColumn`, `join`) |
| `Action` | Executes the plan (`show`, `count`, `collect`, `write`) |
| `Partition` | Chunk of data on one node — more partitions = more parallelism |
| `Catalyst` | Spark's query optimizer — rewrites plan for efficiency |
| `Parquet` | Columnar binary format — use this instead of CSV in production |

**Spark vs Pandas**

| | Pandas | Spark |
|---|---|---|
| Scale | Single machine, fits in RAM | Distributed cluster, larger than RAM |
| Speed | Fast for small/medium data | Optimized for big data |
| API | Rich ecosystem, interactive | Same patterns, production-ready |

**Operations mapping**

| JavaScript / SQL | Spark |
|---|---|
| `.filter()` | `df.filter(col('x') > 5)` |
| `.map()` | `df.withColumn('new', col('x') * 2)` |
| `.reduce()` | `df.groupBy('key').agg(sum('val'))` |
| spread / concat | `a.union(b)` |
| `console.log` | `df.show()` |
| `WHERE` | `df.filter()` |
| `SELECT` | `df.select()` |
| `GROUP BY` | `df.groupBy().agg()` |
| `JOIN` | `df.join(other, on='id', how='left')` |
| `ORDER BY` | `df.orderBy(col('x').desc())` |

**Common gotchas**

- Nothing runs until an action fires — this surprises everyone at first
- `collect()` pulls all data to the driver — never do this on large datasets
- Joins are expensive — broadcast small DataFrames with `F.broadcast(small_df)`
- Repartition before writing to control output file count
- `inferSchema` reads the whole file to guess types — use explicit schema in prod

---

# What Comes Next

Once you are comfortable with local Spark, the natural progression is:

1. **Delta Lake** — ACID transactions on top of Parquet. Versioning, time travel, upserts.
2. **Apache Iceberg** — similar to Delta Lake, more open standard. Used at Netflix, Apple.
3. **Spark on a real cluster** — EMR (AWS), Dataproc (GCP), or Databricks. Same code, different `.master()` string.
4. **Structured Streaming** — Spark for real-time data. Same DataFrame API, but on a live stream instead of a static file.
5. **SageMaker Pipelines** — orchestrate Spark processing jobs as steps in a larger ML pipeline.

The patterns you learned here carry through all of them.

---

Feedback

Working on something similar? Reach out or share your take on [LinkedIn](https://www.linkedin.com/in/opolyakov/).
