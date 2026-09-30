# run
use `poetry run fastapi dev src/danayar/backend --port 8088` to start the project in development environment

# formatting
always run `poetry run black .` before committing

# scripts
- use  `poetry run python scripts/cost_analytics.py` to get a summary of token usage.

# Notes
- add `127.0.0.1 minio` to your `/etc/hosts` file (or `C:\Windows\System32\drivers\etc\hosts` in windows) as temporary solution.
