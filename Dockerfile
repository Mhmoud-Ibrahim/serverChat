
FROM node:20

WORKDIR /chatServer

COPY package*.json ./
RUN npm install


COPY . .


RUN npm run build

ENV PORT=7860
EXPOSE 7860

CMD ["npm", "start"]
