#!/bin/sh
set -eu

# Free web services have no pre-deploy command. Migrate before serving traffic.
# Keep one worker: visitor simulations live in this process's memory.
uv run --no-sync alembic upgrade head
exec uv run --no-sync uvicorn truckworks.api.app:create_app --factory --host 0.0.0.0 --port "${PORT:-10000}" --workers 1
