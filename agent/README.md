# OpenFermi Agent Worker

Pi-based HTTP worker intended to run as one ECS Fargate task per product agent session.

## API

- `GET /` or `GET /health`
- `POST /session`
- `POST /session/:id/message`
- `GET /session/:id/status`
- `POST /session/:id/terminate`

The worker keeps one persisted pi session on local disk and mirrors message/tool state into the existing OpenFermi `agent_sessions`, `agent_messages`, `agent_parts`, and `agent_artifacts` tables when `DATABASE_URL` is configured.

## Required Runtime Env

- `DATABASE_URL` for Postgres dual-write
- one model credential set supported by pi, for example `ANTHROPIC_API_KEY`

## Optional Runtime Env

- `OPENCODE_PORT` default `8080`
- `PRODUCT_SESSION_ID` product session UUID from the Java backend
- `PI_MODEL_PROVIDER` default `anthropic`
- `PI_MODEL_ID` default `claude-sonnet-4-5`
- `PI_THINKING_LEVEL` default `off`
- `PI_WORKSPACE_DIR` default `/workspace`
- `PI_AGENT_DIR` default `/workspace/.pi/agent`
- `WORKER_BASIC_AUTH_USERNAME`
- `WORKER_BASIC_AUTH_PASSWORD`
- `S3_BUNDLE_PREFIX` e.g. `s3://my-bucket/agent-bundles/`
- `AWS_REGION`

## Local Build

```bash
npm install
npm run check
npm run build
```

## Docker Build

```bash
docker build -t openfermi-agent-worker .
```

## ECR Push Example

```bash
AWS_ACCOUNT_ID=123456789012
AWS_REGION=us-east-1
REPO=openfermi-agent-worker
TAG=$(git rev-parse --short HEAD)

aws ecr get-login-password --region "$AWS_REGION" | \
  docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

docker build -t "$REPO:$TAG" .
docker tag "$REPO:$TAG" "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$REPO:$TAG"
docker push "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$REPO:$TAG"
```
