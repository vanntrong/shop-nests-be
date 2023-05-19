FROM node:16.18.0 as base
WORKDIR /app
COPY package.json yarn.lock ./
RUN npm install

FROM node:16.18.0 as build
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:16.18.0 as production
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=base /app/node_modules ./node_modules
CMD ["node", "dist/main"]