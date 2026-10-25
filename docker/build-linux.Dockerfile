# Builds the library, its command line and its tests for Linux against Debian bookworm's qpdf,
# libjpeg-turbo, OpenJPEG and Little CMS (scripts/build-linux.sh).
FROM node:22.23.4-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential cmake ninja-build pkg-config libqpdf-dev libjpeg62-turbo-dev libopenjp2-7-dev liblcms2-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/*
WORKDIR /src
