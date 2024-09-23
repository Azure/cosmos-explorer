FROM mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm

# Install pre-reqs for gyp, and 'canvas' npm module
RUN apt-get update && \
    apt-get install -y \
        make \
        gcc \
        g++ \
        python3-minimal \
        libcairo2-dev \
        libpango1.0-dev \
        && \
    rm -rf /var/lib/apt/lists/*

# Install node-gyp to build native modules
RUN npm install -g node-gyp