FROM node:20-alpine

WORKDIR /app

# Install dependencies first (cached layer)
COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Run migrations then start
CMD ["sh", "-c", "node src/db/migrate.js && node src/db/seed.js && node src/index.js"]

EXPOSE 5000
