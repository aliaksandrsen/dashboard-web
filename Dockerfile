FROM node:26-alpine
WORKDIR /dashboard-ui
RUN npm install -g pnpm@12
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile
COPY . .
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm run build
EXPOSE 8080
CMD ["pnpm", "run", "preview"]
