FROM node:carbon

WORKDIR /usr/src/app
COPY bitcoin-common-0.0.1.tgz ./
COPY package.json ./
COPY launch.sh ./
RUN chmod a+x launch.sh
RUN apt-get update && apt-get install -y dos2unix
RUN dos2unix launch.sh
RUN npm install bitcoin-common-0.0.1.tgz
RUN npm install --production
RUN npm install -g nodemon
COPY app app
EXPOSE 8080
ENTRYPOINT [ "./launch.sh"]