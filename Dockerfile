# This Dockerfile uses multiple stages. For further information visit https://docs.docker.com/develop/develop-images/multistage-build/.

# Use the official nodejs image as a parent image for building the application.
FROM node:current-slim AS buildStage

# Set the working directory.
WORKDIR /usr/src/app

# Copy the file from your host to the current location.
COPY . .

# Run the command inside buildStage image file system.
RUN npm install
RUN npx grunt

# Use the official nodejs image as a parent image for our image
FROM node:current-slim 

# Set the working directory.
WORKDIR /usr/src/app

# Install dependencies required to run the application
COPY package.json .
RUN npm --production install

# Copy build artifacts
COPY --from=buildStage /usr/src/app/webroot/ ./webroot/
COPY --from=buildStage /usr/src/app/src/ ./src/
COPY --from=buildStage /usr/src/app/start.sh .

# Add metadata to the image to describe which port the container is listening on at runtime.
EXPOSE 80

# Set executable to run on container start.
ENTRYPOINT ["./start.sh"]
