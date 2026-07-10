# Build stage
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage - Using a lightweight web server to serve static files
FROM node:20-alpine AS production

WORKDIR /app
# Install serve to serve the built assets
RUN npm install -g serve

COPY --from=build /app/dist ./dist

EXPOSE 5173
# serve on 5173 to match the expected frontend port
CMD ["serve", "-s", "dist", "-l", "5173"]
