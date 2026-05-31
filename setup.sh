#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

echo "=== Event Management System - First-Time Setup ==="
echo ""

# ── 1. nvm + Node.js 20 ───────────────────────────────────────────────────────
if ! command -v nvm &>/dev/null && [ ! -s "$HOME/.nvm/nvm.sh" ]; then
  echo "[1/9] Installing nvm..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
else
  echo "[1/9] nvm already installed, skipping."
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi

if ! node --version 2>/dev/null | grep -q "^v20"; then
  echo "    Installing Node.js 20..."
  nvm install 20
  nvm use 20
  nvm alias default 20
else
  echo "    Node.js $(node --version) already active."
fi

# ── 2. Angular CLI ────────────────────────────────────────────────────────────
if ! command -v ng &>/dev/null; then
  echo "[2/9] Installing Angular CLI..."
  npm install -g @angular/cli
else
  echo "[2/9] Angular CLI already installed, skipping."
fi

# ── 3. PostgreSQL ─────────────────────────────────────────────────────────────
echo "[3/9] Installing and starting PostgreSQL..."
if ! command -v psql &>/dev/null; then
  sudo apt-get update -qq
  sudo apt-get install -y postgresql postgresql-client
fi
sudo service postgresql start 2>/dev/null || true

# ── 4. postgres user password ─────────────────────────────────────────────────
echo "[4/9] Setting postgres user password..."
read -rsp "    Password for the 'postgres' DB user [press Enter to use 'postgres123', or 's' to skip]: " PG_PASSWORD
echo ""
if [ "$PG_PASSWORD" = "s" ]; then
  echo "    Skipping - using whatever password is already set."
  echo "    Make sure your .env DATABASE_URL matches if it differs from 'postgres123'."
  PG_PASSWORD=""
else
  PG_PASSWORD="${PG_PASSWORD:-postgres123}"
  sudo -u postgres psql -c "ALTER USER postgres PASSWORD '$PG_PASSWORD';" 2>/dev/null || true
  echo "    Password set."
fi

# ── 5. Create database ────────────────────────────────────────────────────────
echo "[5/9] Creating database..."
sudo -u postgres psql -c "CREATE DATABASE eventmanagement;" 2>/dev/null \
  && echo "    Database created." \
  || echo "    Database already exists, skipping."

# ── 6. Backend dependencies ───────────────────────────────────────────────────
echo "[6/9] Installing backend dependencies..."
cd "$BACKEND_DIR"
npm install

# ── 7. .env file ──────────────────────────────────────────────────────────────
echo "[7/9] Configuring backend environment..."
if [ ! -f "$BACKEND_DIR/.env" ]; then
  cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
  JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")
  sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" "$BACKEND_DIR/.env"
  if [ -n "$PG_PASSWORD" ] && [ "$PG_PASSWORD" != "postgres123" ]; then
    sed -i "s|DB_PASSWORD=.*|DB_PASSWORD=$PG_PASSWORD|" "$BACKEND_DIR/.env"
    sed -i "s|postgresql://postgres:[^@]*@|postgresql://postgres:$PG_PASSWORD@|" "$BACKEND_DIR/.env"
  fi
  echo "    .env created with a random JWT secret."
else
  echo "    .env already exists, skipping."
fi

# ── 8. Migrations + seed ──────────────────────────────────────────────────────
echo "[8/9] Applying database migrations and seeding..."
cd "$BACKEND_DIR"
if ! npx prisma migrate deploy 2>/dev/null; then
  echo "    Schema exists without migration history - baselining..."
  for migration_dir in prisma/migrations/*/; do
    [ -d "$migration_dir" ] || continue
    npx prisma migrate resolve --applied "$(basename "$migration_dir")" 2>/dev/null || true
  done
  npx prisma migrate deploy
fi
npx prisma db seed || echo "    Seed skipped (data may already exist)."

# ── 9. SSL certificates ───────────────────────────────────────────────────────
echo "[9/9] Generating SSL certificates..."
if [ ! -f "$BACKEND_DIR/certs/cert.pem" ]; then
  mkdir -p "$BACKEND_DIR/certs"
  openssl req -x509 -newkey rsa:2048 \
    -keyout "$BACKEND_DIR/certs/key.pem" \
    -out    "$BACKEND_DIR/certs/cert.pem" \
    -days 365 -nodes -subj "/CN=localhost"
  echo "    Certificates generated."
else
  echo "    Certificates already exist, skipping."
fi

# ── 10. Frontend dependencies ─────────────────────────────────────────────────
echo "[+] Installing frontend dependencies..."
cd "$FRONTEND_DIR"
npm install

echo ""
echo "=== Setup complete! ==="
echo ""
echo "Next steps:"
echo "  1. Start the backend:   cd backend && npm run dev"
echo "  2. Open https://localhost:3000/api/health in your browser"
echo "     and click Advanced -> Proceed to localhost (once per browser)"
echo "  3. Start the frontend:  cd frontend && npm start"
echo "  4. Open http://localhost:4200"
echo ""
echo "Default admin login: admin / admin123"
