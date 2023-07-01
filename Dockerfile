ARG SCRIPT_NAME="dev"

FROM node:16.18.0 as base
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install
COPY . .
RUN yarn build

FROM base as branch-dev
ENV ENV_NAME=":dev"
ENV NODE_ENV="development"

FROM base AS branch-test
ENV ENV_NAME=":test"
ENV NODE_ENV="test"

FROM base AS branch-prod
ENV ENV_NAME=":prod"
ENV NODE_ENV="production"

FROM branch-${SCRIPT_NAME} as final
RUN rm -rf node_modules
RUN yarn install --production
# CMD yarn start${ENV_NAME}
CMD ["node", "dist/main"]


# FROM node:16.18.0 as build
# WORKDIR /app
# COPY --from=base /app/node_modules ./node_modules
# COPY . .
# RUN yarn build

# FROM node:16.18.0 as production
# ENV NODE_ENV=production
# WORKDIR /app
# COPY --from=build /app/dist ./dist
# COPY --from=base /app/node_modules ./node_modules