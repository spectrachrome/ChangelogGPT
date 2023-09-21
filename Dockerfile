# Use an official Node.js runtime as a parent image
FROM node:20

# Set the working directory in the container to /usr/src/app
WORKDIR /usr/src/app

# Bundle app source inside Docker image
COPY . .

# Make port 51277 available to the world outside this container
EXPOSE 51277

# Run app.js when the container launches
CMD [ "node", "app.js" ]