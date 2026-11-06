# OpenRouter & Embedding Setup

> Agent 10 · Integration & QA Documentation

## Overview

The AI Consultation module (Agent 08) uses **OpenRouter** as the LLM gateway, with optional RAG (Retrieval-Augmented Generation) using text embeddings for contextual consulting answers.

---

## 1. OpenRouter API Key

### Get Your Key

1. Register at [https://openrouter.ai](https://openrouter.ai)
2. Navigate to **Keys** → **Create Key**
3. Set a credit limit (recommended: start with \$5 for testing)
4. Copy the API key

### Configure Environment

```env
OPENROUTER_API_KEY=sk-or-v1-YOUR_KEY_HERE
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

---

## 2. Default Chat Model

The AI consultant uses a configurable default model:

```env
OPENROUTER_DEFAULT_MODEL=meta-llama/llama-3.1-8b-instruct:free
```

### Recommended Models by Budget

| Budget | Model | Notes |
|--------|-------|-------|
| Free / Dev | `meta-llama/llama-3.1-8b-instruct:free` | Good quality, free tier |
| Low cost | `google/gemma-2-9b-it:free` | Google model, free tier |
| Medium | `anthropic/claude-3-haiku` | Fast, affordable |
| High quality | `anthropic/claude-3.5-sonnet` | Best quality, higher cost |
| Multilingual (ID) | `meta-llama/llama-3.1-70b-instruct` | Better Indonesian support |

> The system prompt instructs the model to respond in Indonesian (Bahasa Indonesia) by default.

---

## 3. Embedding Setup (RAG)

RAG allows the AI consultant to retrieve relevant catalog/course/service context before answering. This improves answer quality significantly for domain-specific questions.

### Step 1: Choose an Embedding Model

```env
OPENROUTER_EMBEDDING_MODEL=openai/text-embedding-3-small
```

Supported embedding models via OpenRouter:

| Model | Dimensions | Notes |
|-------|-----------|-------|
| `openai/text-embedding-3-small` | 1536 | Best price/quality ratio |
| `openai/text-embedding-3-large` | 3072 | Highest quality, more expensive |
| `openai/text-embedding-ada-002` | 1536 | Legacy, still good |

### Step 2: Vector Database (Optional for MVP)

For production RAG, you need a vector store. Options:

| Option | Notes |
|--------|-------|
| **Supabase pgvector** | Best if already using Supabase Postgres |
| **Pinecone** | Managed vector DB, easy setup |
| **Qdrant** | Self-hosted or cloud |
| **In-memory** | Dev only, not persistent |

> For MVP, the AI module falls back to keyword-based context retrieval if no vector DB is configured. Full RAG requires vector DB integration.

### Step 3: Index Your Content

After setting up the vector DB, run the indexing script (when implemented):

```bash
# Index catalog items, courses, service definitions for RAG
pnpm run ai:index
```

---

## 4. Rate Limiting & Cost Control

### Set Credit Limits

In OpenRouter dashboard: **Keys** → your key → set **Credit Limit** per key.

Recommended limits:
- Dev: \$5–10/month
- Staging: \$10–20/month
- Production: Monitor and set based on actual usage

### Application-level Rate Limiting

The AI consultation module includes per-user rate limiting. Configure via environment:

```env
# Max AI requests per user per hour (default: 10)
AI_RATE_LIMIT_PER_HOUR=10

# Max tokens per request (default: 2000)
AI_MAX_TOKENS=2000
```

---

## 5. Testing the Integration

```bash
# Test that OPENROUTER_API_KEY is working
curl https://openrouter.ai/api/v1/models \
  -H "Authorization: Bearer $OPENROUTER_API_KEY"
```

Expected: JSON list of available models.

---

## 6. Production Checklist

- [ ] `OPENROUTER_API_KEY` set in production environment (never commit to git)
- [ ] Credit limit set appropriately for expected usage
- [ ] Default model selected (consider cost vs. quality tradeoff)
- [ ] Rate limiting configured to prevent cost spikes
- [ ] Error handling verified (graceful fallback when OpenRouter is unreachable)
- [ ] Response caching evaluated for common queries

---

## See Also

- [OpenRouter Documentation](https://openrouter.ai/docs)
- [Environment Variables](./environment-variables.md)
- [AI Consultation Module](../../docs/agent-08-completion-report.md)
