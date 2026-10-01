FROM docker.arvancloud.ir/node:22-alpine3.18

WORKDIR /app

COPY package*.json ./
RUN npm install --frozen-lockfile

COPY . .

CMD ["npm", "run", "dev", "--", "--host"]

EXPOSE 5173



# FROM docker.arvancloud.ir/node:22-alpine AS builder

# WORKDIR /app

# COPY package*.json ./
# RUN npm install --frozen-lockfile

# COPY . .

# RUN npm run build

# FROM docker.arvancloud.ir/nginx:stable-alpine

# RUN rm -rf /usr/share/nginx/html/*

# COPY --from=builder /app/dist /usr/share/nginx/html

# EXPOSE 80

# CMD ["nginx", "-g", "daemon off;"]
