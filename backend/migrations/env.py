"""Use the configured async PostgreSQL engine for explicit user migrations."""

import asyncio

from alembic import context
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.pool import NullPool

from truckworks.persistence.models import Base
from truckworks.settings import Settings

settings = Settings()
if settings.database_url is None or not settings.database_url.get_secret_value().strip():
    raise RuntimeError("backend/.env에 TRUCKWORKS_DATABASE_URL을 설정하세요.")
url = settings.database_url.get_secret_value()


def migrate(connection) -> None:
    context.configure(connection=connection, target_metadata=Base.metadata)
    with context.begin_transaction():
        context.run_migrations()


async def online() -> None:
    engine = create_async_engine(url, poolclass=NullPool)
    try:
        async with engine.connect() as connection:
            await connection.run_sync(migrate)
    finally:
        await engine.dispose()


if context.is_offline_mode():
    context.configure(url=url, target_metadata=Base.metadata, literal_binds=True,
                      dialect_opts={"paramstyle": "named"})
    with context.begin_transaction():
        context.run_migrations()
else:
    asyncio.run(online())
