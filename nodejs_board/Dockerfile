FROM node:latest
RUN apt-get -y -qq update
RUN apt-get -y -qq install vim
RUN mkdir -p /usr/src/app/webapp_borad
WORKDIR /usr/src/app/webapp_board
COPY package*.json /usr/src/app/webapp_board/
RUN npm install
COPY ./webapp_board /usr/src/app/webapp_board
EXPOSE 3000
CMD nodejs bin/www
