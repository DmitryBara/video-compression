FROM node:latest

COPY . .
EXPOSE 4000

RUN apt-get -y update
RUN apt-get -y upgrade
RUN apt-get install -y ffmpeg

RUN npm ci --production --ignore-scripts

# TODO: optimize build
# 1. Do not install dev dependencies
# 2. Run server through: node -r dotenv/config -r source-map-support/register
RUN npm install --only=dev
RUN npm run build
CMD [ "npm", "run", "start:prod" ]