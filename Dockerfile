FROM node:18-alpine

# Set working directory inside container
WORKDIR /usr/src/app

# Copy package configurations
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy app source code
COPY . .

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production

# Start command
CMD ["node", "server.js"]
