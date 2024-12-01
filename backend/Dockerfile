# Use the official Node.js image
FROM node:16

# Set the working directory to /app inside the container
WORKDIR /app

# Copy package.json and package-lock.json for installing dependencies
COPY package*.json ./

# Install the backend dependencies
RUN npm install

# Copy the rest of the backend code to the container
COPY . .

# Expose the port your backend will run on
EXPOSE 5000

# Command to run the backend (server.js)
CMD ["node", "server.js"]
