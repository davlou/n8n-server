FROM ghcr.io/puppeteer/puppeteer:22.1.0

USER root

WORKDIR /app

COPY package.json ./
RUN npm install --production --ignore-scripts && npm cache clean --force

COPY server.js ./

RUN chown -R pptruser:pptruser /app

USER pptruser

# Ensure Puppeteer uses the Chrome bundled in the base image
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

EXPOSE 3000

CMD ["node", "server.js"]