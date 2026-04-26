#!/bin/bash
# setup_env.sh
# Generates secure random keys for ScholarConnect production deployment.

ENV_FILE=".env"

if [ -f "$ENV_FILE" ]; then
    echo "Warning: .env file already exists. Overwriting will replace existing keys."
    read -p "Do you want to overwrite it? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Operation cancelled."
        exit 1
    fi
fi

# Generate 32-byte hex key for AES-256-GCM
ENCRYPTION_KEY=$(openssl rand -hex 32)
# Generate a strong JWT secret
JWT_SECRET=$(openssl rand -base64 48)

cat <<EOF > $ENV_FILE
PORT=5002
NODE_ENV=production
CLIENT_URL=http://localhost:5173
ML_SERVICE_URL=http://ml-service:5001
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d
ENCRYPTION_KEY=$ENCRYPTION_KEY
EOF

echo "✅ Generated secure .env file with new JWT and ENCRYPTION keys."
echo "Please make sure to add any external API keys (e.g. GITHUB_CLIENT_ID) to the .env file."
