FROM node:20-slim

WORKDIR /app

# Install build tools needed to compile sqlite3 from source
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies (sqlite3 will compile from source)
COPY package*.json ./
RUN npm install --build-from-source

# Copy application files
COPY . .

# Set environment variable defaults
ENV PORT=5002
ENV NODE_ENV=production

# Expose the port
EXPOSE 5002

# Initialize DB, seed it, then start the server
CMD node init_db.js && node seed_data.js && node seed_projects.js && node seed_mentors.js && node server.js
