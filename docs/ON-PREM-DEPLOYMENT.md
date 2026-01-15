# On-Premises Telepítési Útmutató

Ez a dokumentáció leírja az alkalmazás on-premises környezetben történő telepítését, beleértve a Keycloak OIDC integrációt.

## Tartalomjegyzék

1. [Előfeltételek](#előfeltételek)
2. [Architektúra áttekintés](#architektúra-áttekintés)
3. [Docker Compose konfiguráció](#docker-compose-konfiguráció)
4. [Adatbázis migrációk](#adatbázis-migrációk)
5. [Keycloak beállítás](#keycloak-beállítás)
6. [Supabase konfiguráció](#supabase-konfiguráció)
7. [Frontend konfiguráció](#frontend-konfiguráció)
8. [Nginx reverse proxy](#nginx-reverse-proxy)
9. [Indítás és ellenőrzés](#indítás-és-ellenőrzés)
10. [Hibaelhárítás](#hibaelhárítás)

---

## Előfeltételek

- Docker Engine 24.0+
- Docker Compose v2.20+
- Minimum 8GB RAM
- 50GB szabad lemezterület
- Érvényes SSL tanúsítványok (production környezethez)

---

## Architektúra áttekintés

```
┌─────────────────────────────────────────────────────────────────┐
│                        Nginx Reverse Proxy                       │
│                         (SSL termination)                        │
└─────────────────┬───────────────┬───────────────┬───────────────┘
                  │               │               │
                  ▼               ▼               ▼
          ┌───────────┐   ┌───────────┐   ┌───────────────┐
          │  Frontend │   │  Supabase │   │   Keycloak    │
          │  (React)  │   │   Stack   │   │   (OIDC IdP)  │
          └───────────┘   └─────┬─────┘   └───────────────┘
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
              ┌──────────┐           ┌──────────┐
              │ Postgres │           │  GoTrue  │
              │    DB    │           │  (Auth)  │
              └──────────┘           └──────────┘
```

---

## Docker Compose konfiguráció

Hozd létre a `docker-compose.yml` fájlt:

```yaml
version: '3.8'

services:
  # ===========================================
  # NGINX REVERSE PROXY
  # ===========================================
  nginx:
    image: nginx:alpine
    container_name: nginx-proxy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - frontend
      - supabase-kong
      - keycloak
    networks:
      - app-network
    restart: unless-stopped

  # ===========================================
  # FRONTEND APPLICATION
  # ===========================================
  frontend:
    image: nginx:alpine
    container_name: frontend
    volumes:
      - ./frontend/dist:/usr/share/nginx/html:ro
      - ./frontend/config.js:/usr/share/nginx/html/config.js:ro
      - ./frontend/nginx.conf:/etc/nginx/conf.d/default.conf:ro
    networks:
      - app-network
    restart: unless-stopped

  # ===========================================
  # KEYCLOAK IDENTITY PROVIDER
  # ===========================================
  keycloak:
    image: quay.io/keycloak/keycloak:23.0
    container_name: keycloak
    command: start
    environment:
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://keycloak-db:5432/keycloak
      KC_DB_USERNAME: ${KEYCLOAK_DB_USER:-keycloak}
      KC_DB_PASSWORD: ${KEYCLOAK_DB_PASSWORD}
      KC_HOSTNAME: ${KEYCLOAK_HOSTNAME}
      KC_HOSTNAME_STRICT: "false"
      KC_HTTP_ENABLED: "true"
      KC_PROXY: edge
      KEYCLOAK_ADMIN: ${KEYCLOAK_ADMIN:-admin}
      KEYCLOAK_ADMIN_PASSWORD: ${KEYCLOAK_ADMIN_PASSWORD}
    depends_on:
      keycloak-db:
        condition: service_healthy
    networks:
      - app-network
    restart: unless-stopped

  keycloak-db:
    image: postgres:15-alpine
    container_name: keycloak-db
    environment:
      POSTGRES_DB: keycloak
      POSTGRES_USER: ${KEYCLOAK_DB_USER:-keycloak}
      POSTGRES_PASSWORD: ${KEYCLOAK_DB_PASSWORD}
    volumes:
      - keycloak-db-data:/var/lib/postgresql/data
    networks:
      - app-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${KEYCLOAK_DB_USER:-keycloak}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  # ===========================================
  # SUPABASE STACK
  # ===========================================
  supabase-db:
    image: supabase/postgres:15.1.1.61
    container_name: supabase-db
    environment:
      POSTGRES_PASSWORD: ${SUPABASE_DB_PASSWORD}
      POSTGRES_DB: postgres
    volumes:
      - supabase-db-data:/var/lib/postgresql/data
      - ./supabase/migrations:/docker-entrypoint-initdb.d
    networks:
      - app-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  supabase-auth:
    image: supabase/gotrue:v2.151.0
    container_name: supabase-auth
    environment:
      GOTRUE_API_HOST: 0.0.0.0
      GOTRUE_API_PORT: 9999
      API_EXTERNAL_URL: ${SUPABASE_PUBLIC_URL}
      
      GOTRUE_DB_DRIVER: postgres
      GOTRUE_DB_DATABASE_URL: postgres://supabase_auth_admin:${SUPABASE_DB_PASSWORD}@supabase-db:5432/postgres
      
      GOTRUE_SITE_URL: ${APP_URL}
      GOTRUE_URI_ALLOW_LIST: ${APP_URL}/*
      GOTRUE_DISABLE_SIGNUP: "false"
      
      GOTRUE_JWT_SECRET: ${JWT_SECRET}
      GOTRUE_JWT_EXP: 3600
      GOTRUE_JWT_DEFAULT_GROUP_NAME: authenticated
      
      # Keycloak OIDC Provider
      GOTRUE_EXTERNAL_KEYCLOAK_ENABLED: "true"
      GOTRUE_EXTERNAL_KEYCLOAK_CLIENT_ID: ${KEYCLOAK_CLIENT_ID}
      GOTRUE_EXTERNAL_KEYCLOAK_SECRET: ${KEYCLOAK_CLIENT_SECRET}
      GOTRUE_EXTERNAL_KEYCLOAK_URL: ${KEYCLOAK_REALM_URL}
      GOTRUE_EXTERNAL_KEYCLOAK_REDIRECT_URI: ${SUPABASE_PUBLIC_URL}/auth/v1/callback
      
      GOTRUE_MAILER_AUTOCONFIRM: "true"
    depends_on:
      supabase-db:
        condition: service_healthy
    networks:
      - app-network
    restart: unless-stopped

  supabase-rest:
    image: postgrest/postgrest:v12.0.2
    container_name: supabase-rest
    environment:
      PGRST_DB_URI: postgres://authenticator:${SUPABASE_DB_PASSWORD}@supabase-db:5432/postgres
      PGRST_DB_SCHEMAS: public,storage
      PGRST_DB_ANON_ROLE: anon
      PGRST_JWT_SECRET: ${JWT_SECRET}
      PGRST_DB_USE_LEGACY_GUCS: "false"
    depends_on:
      supabase-db:
        condition: service_healthy
    networks:
      - app-network
    restart: unless-stopped

  supabase-realtime:
    image: supabase/realtime:v2.28.32
    container_name: supabase-realtime
    environment:
      PORT: 4000
      DB_HOST: supabase-db
      DB_PORT: 5432
      DB_USER: supabase_admin
      DB_PASSWORD: ${SUPABASE_DB_PASSWORD}
      DB_NAME: postgres
      DB_AFTER_CONNECT_QUERY: 'SET search_path TO _realtime'
      DB_ENC_KEY: ${REALTIME_ENC_KEY}
      API_JWT_SECRET: ${JWT_SECRET}
      SECRET_KEY_BASE: ${REALTIME_SECRET_KEY_BASE}
    depends_on:
      supabase-db:
        condition: service_healthy
    networks:
      - app-network
    restart: unless-stopped

  supabase-storage:
    image: supabase/storage-api:v0.46.4
    container_name: supabase-storage
    environment:
      ANON_KEY: ${SUPABASE_ANON_KEY}
      SERVICE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
      POSTGREST_URL: http://supabase-rest:3000
      PGRST_JWT_SECRET: ${JWT_SECRET}
      DATABASE_URL: postgres://supabase_storage_admin:${SUPABASE_DB_PASSWORD}@supabase-db:5432/postgres
      FILE_SIZE_LIMIT: 52428800
      STORAGE_BACKEND: file
      FILE_STORAGE_BACKEND_PATH: /var/lib/storage
      TENANT_ID: stub
      REGION: local
      GLOBAL_S3_BUCKET: stub
    volumes:
      - supabase-storage-data:/var/lib/storage
    depends_on:
      supabase-db:
        condition: service_healthy
      supabase-rest:
        condition: service_started
    networks:
      - app-network
    restart: unless-stopped

  supabase-kong:
    image: kong:2.8.1
    container_name: supabase-kong
    environment:
      KONG_DATABASE: "off"
      KONG_DECLARATIVE_CONFIG: /var/lib/kong/kong.yml
      KONG_DNS_ORDER: LAST,A,CNAME
      KONG_PLUGINS: request-transformer,cors,key-auth,acl,basic-auth
      KONG_NGINX_PROXY_PROXY_BUFFER_SIZE: 160k
      KONG_NGINX_PROXY_PROXY_BUFFERS: 64 160k
    volumes:
      - ./supabase/kong.yml:/var/lib/kong/kong.yml:ro
    depends_on:
      - supabase-auth
      - supabase-rest
      - supabase-realtime
      - supabase-storage
    networks:
      - app-network
    restart: unless-stopped

networks:
  app-network:
    driver: bridge

volumes:
  keycloak-db-data:
  supabase-db-data:
  supabase-storage-data:
```

---

## Környezeti változók

Hozd létre a `.env` fájlt:

```bash
# ===========================================
# DOMAIN CONFIGURATION
# ===========================================
APP_URL=https://app.yourdomain.com
SUPABASE_PUBLIC_URL=https://api.yourdomain.com
KEYCLOAK_HOSTNAME=auth.yourdomain.com

# ===========================================
# KEYCLOAK CONFIGURATION
# ===========================================
KEYCLOAK_DB_USER=keycloak
KEYCLOAK_DB_PASSWORD=<strong-password-1>
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=<strong-password-2>

# Keycloak OIDC Client (created in Keycloak admin)
KEYCLOAK_CLIENT_ID=supabase-app
KEYCLOAK_CLIENT_SECRET=<client-secret-from-keycloak>
KEYCLOAK_REALM_URL=https://auth.yourdomain.com/realms/your-realm

# ===========================================
# SUPABASE CONFIGURATION
# ===========================================
SUPABASE_DB_PASSWORD=<strong-password-3>

# Generate with: openssl rand -base64 32
JWT_SECRET=<your-jwt-secret-min-32-chars>

# Generate with: openssl rand -hex 32
REALTIME_ENC_KEY=<32-byte-hex-key>
REALTIME_SECRET_KEY_BASE=<64-byte-hex-key>

# Generate these keys using supabase CLI or manually
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

---

## Adatbázis migrációk

**FONTOS**: A `supabase/migrations` mappában található SQL fájlok NEM futnak le automatikusan self-hosted környezetben. Manuálisan kell alkalmazni őket!

### 1. Migrációk alkalmazása

A Supabase Postgres konténer elindítása után futtasd a migrációkat:

```bash
# Összes migráció alkalmazása sorrendben
for f in supabase/migrations/*.sql; do
  echo "Running migration: $f"
  docker-compose exec -T supabase-db psql -U postgres -d postgres -f - < "$f"
done
```

Vagy egyenként:

```bash
# Példa egy konkrét migráció futtatására
docker-compose exec -T supabase-db psql -U postgres -d postgres < supabase/migrations/20251212104944_remix_migration_from_pg_dump.sql
```

### 2. Migráció script létrehozása

Hozz létre egy `scripts/run-migrations.sh` fájlt az egyszerűbb kezeléshez:

```bash
#!/bin/bash
set -e

MIGRATIONS_DIR="supabase/migrations"
DB_CONTAINER="supabase-db"

echo "Waiting for database to be ready..."
until docker-compose exec -T $DB_CONTAINER pg_isready -U postgres; do
  sleep 2
done

echo "Running migrations..."
for migration in $(ls $MIGRATIONS_DIR/*.sql | sort); do
  echo "Applying: $(basename $migration)"
  docker-compose exec -T $DB_CONTAINER psql -U postgres -d postgres -f - < "$migration"
  if [ $? -eq 0 ]; then
    echo "✓ $(basename $migration) applied successfully"
  else
    echo "✗ Failed to apply $(basename $migration)"
    exit 1
  fi
done

echo "All migrations applied successfully!"
```

```bash
chmod +x scripts/run-migrations.sh
./scripts/run-migrations.sh
```

### 3. Docker init container (opcionális)

A `docker-compose.yml`-ben hozzáadhatsz egy init konténert a migrációkhoz:

```yaml
services:
  migrations:
    image: postgres:15-alpine
    depends_on:
      supabase-db:
        condition: service_healthy
    volumes:
      - ./supabase/migrations:/migrations:ro
    environment:
      PGHOST: supabase-db
      PGUSER: postgres
      PGPASSWORD: ${SUPABASE_DB_PASSWORD}
      PGDATABASE: postgres
    entrypoint: ["/bin/sh", "-c"]
    command:
      - |
        for f in /migrations/*.sql; do
          echo "Running: $$f"
          psql -f "$$f"
        done
    networks:
      - app-network
```

### 4. Migráció állapot ellenőrzése

A migrációk alkalmazása után ellenőrizd a táblák létrejöttét:

```bash
docker-compose exec supabase-db psql -U postgres -d postgres -c "\dt public.*"
```

Elvárt táblák:
- `admin_users` - Admin felhasználók (tartalmazza a `teszt@localhost.com` seed rekordot)
- `profiles` - Felhasználói profilok
- `achievements` - Elérhető jelvények
- `user_achievements` - Felhasználói jelvények
- `user_points` - Pont előzmények
- `consent_versions` - Beleegyezés verziók
- `user_consents` - Felhasználói beleegyezések
- stb.

---

## Keycloak beállítás

### 1. Realm létrehozása

1. Nyisd meg: `https://auth.yourdomain.com/admin`
2. Jelentkezz be az admin felhasználóval
3. Create Realm → Name: `your-realm`

### 2. Client létrehozása

1. Clients → Create client
2. Állítsd be:

| Beállítás | Érték |
|-----------|-------|
| Client ID | `supabase-app` |
| Client Protocol | `openid-connect` |
| Access Type | `confidential` |
| Valid Redirect URIs | `https://api.yourdomain.com/auth/v1/callback` |
| Web Origins | `https://app.yourdomain.com` |

3. Credentials fül → Másold ki a **Client Secret**-et

### 3. User federation (opcionális)

LDAP/AD integráció esetén:
1. User Federation → Add provider → LDAP
2. Konfiguráld az AD/LDAP kapcsolatot

---

## Frontend konfiguráció

### 1. Build elkészítése

```bash
npm run build
```

### 2. config.js létrehozása

Hozd létre a `frontend/config.js` fájlt:

```javascript
window.appConfig = {
  KEYCLOAK_REDIRECT_URI: "https://app.yourdomain.com/",
  SUPABASE_URL: "https://api.yourdomain.com",
  SUPABASE_ANON_KEY: "<your-anon-key>"
};
```

### 3. Frontend nginx.conf

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Don't cache config.js
    location = /config.js {
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }
}
```

---

## Nginx reverse proxy

Hozd létre a `nginx/nginx.conf` fájlt:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server frontend:80;
    }

    upstream supabase {
        server supabase-kong:8000;
    }

    upstream keycloak {
        server keycloak:8080;
    }

    # Frontend
    server {
        listen 443 ssl http2;
        server_name app.yourdomain.com;

        ssl_certificate /etc/nginx/ssl/app.crt;
        ssl_certificate_key /etc/nginx/ssl/app.key;

        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }

    # Supabase API
    server {
        listen 443 ssl http2;
        server_name api.yourdomain.com;

        ssl_certificate /etc/nginx/ssl/api.crt;
        ssl_certificate_key /etc/nginx/ssl/api.key;

        location / {
            proxy_pass http://supabase;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # WebSocket support
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
    }

    # Keycloak
    server {
        listen 443 ssl http2;
        server_name auth.yourdomain.com;

        ssl_certificate /etc/nginx/ssl/auth.crt;
        ssl_certificate_key /etc/nginx/ssl/auth.key;

        location / {
            proxy_pass http://keycloak;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            proxy_buffer_size 128k;
            proxy_buffers 4 256k;
            proxy_busy_buffers_size 256k;
        }
    }

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name _;
        return 301 https://$host$request_uri;
    }
}
```

---

## Indítás és ellenőrzés

### 1. Indítás

```bash
# Környezet előkészítése
mkdir -p nginx/ssl frontend

# SSL tanúsítványok elhelyezése
cp your-certs/* nginx/ssl/

# Frontend build másolása
cp -r dist/* frontend/

# Indítás
docker-compose up -d

# Logok figyelése
docker-compose logs -f
```

### 2. Ellenőrzés

```bash
# Szolgáltatások állapota
docker-compose ps

# Keycloak health check
curl -k https://auth.yourdomain.com/health

# Supabase health check
curl -k https://api.yourdomain.com/rest/v1/

# Frontend elérhetőség
curl -k https://app.yourdomain.com/
```

---

## Hibaelhárítás

### Gyakori hibák

| Hiba | Megoldás |
|------|----------|
| `CORS error` | Ellenőrizd a Keycloak Web Origins beállítást |
| `invalid_client` | Ellenőrizd a client secret-et |
| `redirect_uri_mismatch` | Ellenőrizd a Valid Redirect URIs-t |
| `connection refused` | Ellenőrizd a Docker network-öt |

### Logok ellenőrzése

```bash
# Összes szolgáltatás
docker-compose logs

# Specifikus szolgáltatás
docker-compose logs supabase-auth
docker-compose logs keycloak

# Valós idejű követés
docker-compose logs -f --tail=100 supabase-auth
```

### Debug mód

```bash
# Keycloak debug
docker-compose exec keycloak /opt/keycloak/bin/kcadm.sh config credentials \
  --server http://localhost:8080 \
  --realm master \
  --user admin \
  --password $KEYCLOAK_ADMIN_PASSWORD
```

---

## Biztonsági ajánlások

1. **SSL/TLS**: Mindig használj érvényes SSL tanúsítványokat production környezetben
2. **Jelszavak**: Használj erős, egyedi jelszavakat minden szolgáltatáshoz
3. **Tűzfal**: Csak a szükséges portokat nyisd meg (80, 443)
4. **Backup**: Rendszeres adatbázis mentés beállítása
5. **Monitoring**: Prometheus + Grafana integráció ajánlott
6. **Updates**: Rendszeres image frissítések

---

## Kapcsolódó dokumentáció

- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [Supabase Self-Hosting Guide](https://supabase.com/docs/guides/self-hosting)
- [Docker Compose Reference](https://docs.docker.com/compose/)
