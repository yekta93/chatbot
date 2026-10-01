FROM mcr.microsoft.com/devcontainers/python:dev-3.11-bookworm
USER vscode
RUN curl https://dl.min.io/client/mc/release/linux-amd64/mc \
  --create-dirs \
  -o $HOME/minio-binaries/mc
RUN chmod +x $HOME/minio-binaries/mc
RUN mkdir /home/vscode/.cache/ && chown -R vscode /home/vscode/.cache/
