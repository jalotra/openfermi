# LaTeX Solver Agent

Cloudflare Worker agent that generates validated LaTeX solutions for competitive exam questions.

## Architecture

1. Frontend sends question to this agent
2. Agent calls LLM (OpenRouter / Gemini) to generate LaTeX hints + solution
3. Agent validates LaTeX by compiling via [latex-on-http](https://github.com/YtoTech/latex-on-http)
4. If compilation fails, error logs are fed back to the LLM for retry (up to 3 attempts)
5. Validated solution is persisted to the Java backend

## Local Development

```bash
npm install
cp .env.example .dev.vars   # Cloudflare Workers uses .dev.vars for local secrets
# Edit .dev.vars with your actual keys
npm run dev
```

The agent runs at `http://localhost:8787`.

### Test endpoint

```bash
curl -X POST http://localhost:8787/agents/latex-solver-agent/test-question-1 \
  -H "Content-Type: application/json" \
  -d '{"questionId":"test-1","questionText":"Find the integral of x^2 dx"}'
```

## Deployment

### 1. Deploy latex-on-http on Render

Create a new **Web Service** on [Render](https://render.com):

- **Environment:** Docker
- **Docker image:** `yoant/latexonhttp-python`
- **Port:** 2345
- **Health check path:** `/texlive/information`
- **Plan:** Starter or higher (needs ~1GB RAM for TeX Live)

Copy the Render service URL (e.g. `https://latex-solver.onrender.com`).

### 2. Deploy the Cloudflare Agent

```bash
# Set secrets
wrangler secret put OPENROUTER_API_KEY
wrangler secret put LATEX_HTTP_URL      # e.g. https://latex-solver.onrender.com
wrangler secret put BACKEND_URL         # e.g. https://api.openfermi.com
wrangler secret put BACKEND_API_KEY

# Deploy
npm run deploy
```

### 3. Update frontend

Set `LATEX_AGENT_URL` in `frontend/.env` to your deployed Worker URL (e.g. `https://latex-solver-agent.<your-subdomain>.workers.dev`).
