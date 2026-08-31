# Build context is the repo root (see docker-compose.yml) so this can reach both app/ and server/.

FROM node:20-alpine AS frontend-build
WORKDIR /repo/app
COPY app/package*.json ./
RUN npm install
COPY app ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY server/package*.json ./server/
RUN npm --prefix server install --omit=dev
COPY server ./server
COPY --from=frontend-build /repo/app/dist ./app/dist
ENV STATIC_DIR=/app/app/dist
ENV UPLOADS_DIR=/app/server/uploads
EXPOSE 3001
CMD ["node", "server/src/index.js"]
