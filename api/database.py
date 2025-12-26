import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import NullPool

# Get database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/nbhd_city")

# Create async engine
# NullPool is used for better compatibility with serverless (Lambda)
# For development, could use QueuePool instead
engine = create_async_engine(
    DATABASE_URL,
    echo=False,  # Set to True for SQL logging in development
    future=True,
    pool_pre_ping=True,  # Verify connections before using them
    poolclass=NullPool,  # Better for serverless, simple for development
)

# Create async session factory
async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,  # Don't expire objects after commit (important for async)
    autoflush=False,
    autocommit=False,
)

# Declarative base for ORM models
Base = declarative_base()


async def get_db() -> AsyncSession:
    """
    Dependency for FastAPI to inject database session.

    Usage in endpoints:
        @app.get("/endpoint")
        async def endpoint(db: AsyncSession = Depends(get_db)):
            # Use db here
    """
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """
    Initialize database by creating all tables.
    Call this on application startup if needed.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db():
    """
    Close database connections.
    Call this on application shutdown.
    """
    await engine.dispose()
