# ---- Build Stage ----
FROM node:18-alpine AS build
WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

# Build with env variables baked in
ARG VITE_API_BASE_URL=http://localhost:8083
ARG VITE_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_TILE_URL=$VITE_TILE_URL

RUN npm run build

# ---- Production Stage (nginx) ----
FROM nginx:alpine

# Custom nginx config for SPA routing
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location /api/ { \
        proxy_pass http://backend:8083; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
    } \
    location /uploads/ { \
        proxy_pass http://backend:8083; \
    } \
    location /swagger-ui/ { \
        proxy_pass http://backend:8083; \
    } \
    location /api-docs { \
        proxy_pass http://backend:8083; \
    } \
}' > /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
