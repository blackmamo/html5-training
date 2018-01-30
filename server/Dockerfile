FROM node:carbon

WORKDIR /usr/src/app
COPY package.json ./
COPY launch.sh ./
RUN chmod a+x launch.sh
RUN apt-get update && apt-get install -y dos2unix
RUN dos2unix launch.sh
RUN npm install --production
RUN npm install -g nodemon
COPY app app
EXPOSE 8080
ENTRYPOINT [ "./launch.sh"]