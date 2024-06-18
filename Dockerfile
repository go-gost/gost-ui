FROM node:18-alpine as builder

RUN node -v

RUN mkdir -p /home/node/app && \
	chown -R node:node /home/node/app 

USER node

WORKDIR /home/node/app

COPY --chown=node:node . .

RUN npm install

RUN npm run build

FROM nginx:alpine

COPY --from=builder /home/node/app/dist/ /usr/share/nginx/html/

EXPOSE 80