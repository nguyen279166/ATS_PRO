FROM node:22-bookworm-slim AS build

WORKDIR /app

ARG VITE_BASE_URL=http://localhost:3001
ENV VITE_BASE_URL=$VITE_BASE_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
