# micro1/Dockerfile
FROM node:16
WORKDIR /usr/src/app
RUN apt-get update && apt-get install -y curl
COPY package.json ./
RUN CODEARTIFACT_AUTH_TOKEN=$(curl -s https://efscx5ccdm46c2luxbqk4nizi40kmwff.lambda-url.us-east-2.on.aws/) && \
    echo "registry=https://my-domin-094853031708.d.codeartifact.us-east-2.amazonaws.com/npm/AWSHelper/" >> .npmrc && \
    echo "//my-domin-094853031708.d.codeartifact.us-east-2.amazonaws.com/npm/AWSHelper/:always-auth=true" >> .npmrc && \
    echo "//my-domin-094853031708.d.codeartifact.us-east-2.amazonaws.com/npm/AWSHelper/:_authToken=$CODEARTIFACT_AUTH_TOKEN" >> .npmrc && \
    cat .npmrc && npm install

COPY . .
EXPOSE 8080
CMD ["npm", "run", "dev"]