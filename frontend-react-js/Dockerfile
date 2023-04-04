FROM 545016258184.dkr.ecr.us-east-1.amazonaws.com/cruddur-node:16.18

ENV PORT=3000

COPY . /frontend-react-js
WORKDIR /frontend-react-js
RUN npm install
EXPOSE ${PORT}
CMD ["npm", "start"]