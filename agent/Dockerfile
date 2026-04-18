FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json ./
RUN npm install

FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json tsconfig.json ./
COPY src ./src
COPY bundled-skills ./bundled-skills
RUN npm run build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends bash ca-certificates curl git ripgrep \
  && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./package.json
COPY bundled-skills ./bundled-skills
RUN mkdir -p /workspace /workspace/.pi/agent /workspace/uploads /workspace/sessions
ENV NODE_ENV=production
ENV OPENCODE_PORT=8080
EXPOSE 8080
CMD ["node", "dist/index.js"]
