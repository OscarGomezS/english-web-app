FROM node:24-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
EXPOSE 3500
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3500"]
