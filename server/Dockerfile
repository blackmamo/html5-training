FROM node:carbon

WORKDIR /usr/src/app
COPY package.json ./
RUN npm install --production
COPY app app
EXPOSE 8080
CMD [ "start"]
ENTRYPOINT [ "npm", "run"]