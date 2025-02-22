# Use a base image with both Python and Deno
FROM python:3.9-slim

RUN apt update -y \
  && apt clean \
  && apt install bash curl unzip -y

# Install spotdl package
COPY requirements.txt .
RUN pip install -r requirements.txt
RUN spotdl --download-ffmpeg

# Install Deno
ENV DENO_INSTALL="/root/.deno"
RUN curl -fsSL https://deno.land/x/install/install.sh | sh
ENV PATH="${DENO_INSTALL}/bin:${PATH}"

# Expose server port
EXPOSE 8000

# Create and set working directory
WORKDIR /app

# Copy source code
COPY . .

# Cache dependencies
RUN deno cache --lock deno.lock --allow-import main.ts


# Set up entry point
ENTRYPOINT ["deno", "run", "--allow-all", "main.ts"]