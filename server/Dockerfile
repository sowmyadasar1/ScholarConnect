FROM node:20-alpine

WORKDIR /app

# Install dependencies first for layer caching
COPY package*.json ./
RUN npm install

# Copy application files
COPY . .

# Set environment variable defaults
ENV PORT=5002
ENV NODE_ENV=production

EXPOSE 5002

# Run database init script then start server
CMD node init_db.js && node seed_data.js && node seed_projects.js && node seed_mentors.js && node server.js
