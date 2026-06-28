FROM node:22-bookworm

# Install system dependencies.
#   sudo        — sandcastle runs `sudo: true` hooks by prepending `sudo `, so the
#                 binary must exist and the agent user needs passwordless sudo (below).
#   postgresql  — a throwaway local Postgres for headless Playwright E2E. There is no
#                 docker-in-docker, so `bun run db:start` (docker compose) cannot work;
#                 we run Postgres directly in this container instead. E2E + drizzle
#                 push target it via DATABASE_URL, so they can never reach production.
RUN apt-get update && apt-get install -y \
  git \
  curl \
  jq \
  sudo \
  postgresql \
  postgresql-client \
  && rm -rf /var/lib/apt/lists/*

# Trust auth on localhost only: lets the agent create/drop the throwaway E2E
# database without a password. Safe because Postgres listens on localhost inside
# this isolated container and holds no real data. pg_hba is matched top-to-bottom
# (first match wins), so these MUST be prepended — appending leaves the default
# scram rule for 127.0.0.1 in front of ours, which would force a password prompt.
RUN set -eux; conf="$(ls -d /etc/postgresql/*/main)"; \
  sed -i '1i local all all trust\nhost all all 127.0.0.1/32 trust\nhost all all ::1/128 trust' "$conf/pg_hba.conf"; \
  echo "listen_addresses='localhost'" >> "$conf/postgresql.conf"

# Install GitHub CLI
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
  | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
  && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
  | tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
  && apt-get update && apt-get install -y gh \
  && rm -rf /var/lib/apt/lists/*

# Build-args for UID/GID alignment: sandcastle docker build-image
# defaults these to the host user's UID/GID so image-built files
# and bind-mounted files share an owner without runtime chown.
ARG AGENT_UID=1000
ARG AGENT_GID=1000

# Rename the base image's "node" user to "agent" and align UID/GID.
RUN groupmod -o -g $AGENT_GID node && usermod -o -u $AGENT_UID -g $AGENT_GID -d /home/agent -m -l agent node

# Passwordless sudo for the agent — sandcastle's `sudo: true` hooks (and the
# explicit `sudo` in main.ts's Postgres bootstrap) run non-interactively.
RUN echo "agent ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/agent && chmod 0440 /etc/sudoers.d/agent

USER ${AGENT_UID}:${AGENT_GID}

# Install Claude Code CLI
RUN curl -fsSL https://claude.ai/install.sh | bash

# Install Bun (this is a Bun workspace that uses the catalog: protocol)
RUN curl -fsSL https://bun.sh/install | bash

# Add Claude and Bun to PATH
ENV PATH="/home/agent/.local/bin:/home/agent/.bun/bin:$PATH"

WORKDIR /home/agent

# In worktree sandbox mode, Sandcastle bind-mounts the git worktree at /home/agent/workspace
# and overrides the working directory to /home/agent/workspace at container start.
# Structure your Dockerfile so that /home/agent/workspace can serve as the project root.
ENTRYPOINT ["sleep", "infinity"]
