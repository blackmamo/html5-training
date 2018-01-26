FROM node:carbon

WORKDIR /usr/src/app
COPY package.json ./
RUN npm install --production
COPY app app
EXPOSE 80
CMD [ "npm", "start" ]