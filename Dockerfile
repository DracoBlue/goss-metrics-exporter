FROM node:12.16.2-alpine3.11
RUN mkdir -p /usr/src/app
ADD package*.json /usr/src/app/
ADD index.js /usr/src/app/
WORKDIR /usr/src/app
RUN npm install
USER node
ARG APP_VERSION
ENV APP_VERSION $APP_VERSION
ENV NODE_ENV "production"
ENV PORT 9442
CMD npm start
