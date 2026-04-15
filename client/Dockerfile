# Production image for the Xetrius Next.js app (WireFluid-facing dApp)
# Build: docker build -t xetrius-client --build-arg NEXT_PUBLIC_TEAM_PASS_ADDRESS=0x... (see README)
# Run:  docker run -p 3000:3000 --env-file .env.production xetrius-client

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Public env vars must be present at build time for Next.js client bundle
ARG NEXT_PUBLIC_TEAM_PASS_ADDRESS
ARG NEXT_PUBLIC_MISSION_STAMPS_ADDRESS
ARG NEXT_PUBLIC_QUEST_ENGINE_ADDRESS
ARG NEXT_PUBLIC_FAN_WARS_ADDRESS
ARG NEXT_PUBLIC_RPC_URL_WIREFLUID=https://evm.wirefluid.com
ARG NEXT_PUBLIC_ACTIVE_MATCH_ID=1
ARG NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
ENV NEXT_PUBLIC_TEAM_PASS_ADDRESS=$NEXT_PUBLIC_TEAM_PASS_ADDRESS
ENV NEXT_PUBLIC_MISSION_STAMPS_ADDRESS=$NEXT_PUBLIC_MISSION_STAMPS_ADDRESS
ENV NEXT_PUBLIC_QUEST_ENGINE_ADDRESS=$NEXT_PUBLIC_QUEST_ENGINE_ADDRESS
ENV NEXT_PUBLIC_FAN_WARS_ADDRESS=$NEXT_PUBLIC_FAN_WARS_ADDRESS
ENV NEXT_PUBLIC_RPC_URL_WIREFLUID=$NEXT_PUBLIC_RPC_URL_WIREFLUID
ENV NEXT_PUBLIC_ACTIVE_MATCH_ID=$NEXT_PUBLIC_ACTIVE_MATCH_ID
ENV NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=$NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
ENV DOCKER=1
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
