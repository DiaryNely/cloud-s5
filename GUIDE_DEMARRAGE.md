## Prérequis
- Docker + Docker Compose
- Node.js 18+
- Git

## Commandes

```bash
# 1. Cloner le projet
git clone <URL_DU_REPO> cloud-s5
cd cloud-s5

# 2. Nettoyer les anciens conteneurs et volumes
docker compose down -v

# 3. Lancer Docker (PostgreSQL + TileServer + Backend Java 17)
docker compose up -d

# 4. Frontend Web (Terminal séparé)
cd cloud-s5-p17-web
npm install
npm run dev

# 5. Frontend Mobile (Terminal séparé)
cd cloud-s5-p17-mobile
npm install
npm run dev
```

## Ports

| Service         | Port |
|-----------------|------|
| PostgreSQL      | 5433 |
| TileServer      | 8081 |
| Backend API     | 8083 |
| Frontend Web    | 5173 |
| Frontend Mobile | 5175 |

## Arrêter tout

```bash
docker compose down -v
```
