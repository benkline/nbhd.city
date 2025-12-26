"""
CRUD operations for neighborhoods and memberships.
"""

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from db_models import Neighborhood, Membership


async def get_neighborhoods(db: AsyncSession, skip: int = 0, limit: int = 100):
    """
    Get all neighborhoods with member count and pagination.
    """
    # Subquery to count members
    member_count_subquery = (
        select(func.count(Membership.id))
        .where(Membership.neighborhood_id == Neighborhood.id)
        .correlate(Neighborhood)
        .scalar_subquery()
    )

    result = await db.execute(
        select(
            Neighborhood,
            member_count_subquery.label("member_count"),
        )
        .offset(skip)
        .limit(limit)
        .order_by(Neighborhood.created_at.desc())
    )

    # Return neighborhoods with member counts
    neighborhoods = []
    for row in result:
        neighborhood = row[0]
        neighborhood.member_count = row[1] or 0
        neighborhoods.append(neighborhood)

    return neighborhoods


async def get_neighborhood(db: AsyncSession, neighborhood_id: int) -> Neighborhood | None:
    """
    Get a single neighborhood by ID.
    """
    result = await db.execute(select(Neighborhood).where(Neighborhood.id == neighborhood_id))
    return result.scalar_one_or_none()


async def get_neighborhood_with_members(
    db: AsyncSession, neighborhood_id: int
) -> Neighborhood | None:
    """
    Get a neighborhood with all its members.
    """
    result = await db.execute(
        select(Neighborhood)
        .where(Neighborhood.id == neighborhood_id)
        .options(selectinload(Neighborhood.memberships))
    )
    return result.scalar_one_or_none()


async def create_neighborhood(
    db: AsyncSession, name: str, description: str | None, created_by: str
) -> Neighborhood:
    """
    Create a new neighborhood.
    """
    neighborhood = Neighborhood(
        name=name,
        description=description,
        created_by=created_by,
    )
    db.add(neighborhood)
    await db.flush()  # Flush to get the ID
    return neighborhood


async def get_user_memberships(db: AsyncSession, user_id: str):
    """
    Get all neighborhoods that a user is a member of.
    """
    # Subquery to count members
    member_count_subquery = (
        select(func.count(Membership.id))
        .where(Membership.neighborhood_id == Neighborhood.id)
        .correlate(Neighborhood)
        .scalar_subquery()
    )

    result = await db.execute(
        select(
            Neighborhood,
            member_count_subquery.label("member_count"),
        )
        .join(Membership, Neighborhood.id == Membership.neighborhood_id)
        .where(Membership.user_id == user_id)
        .order_by(Neighborhood.created_at.desc())
    )

    # Return neighborhoods with member counts
    neighborhoods = []
    for row in result:
        neighborhood = row[0]
        neighborhood.member_count = row[1] or 0
        neighborhoods.append(neighborhood)

    return neighborhoods


async def get_membership(
    db: AsyncSession, user_id: str, neighborhood_id: int
) -> Membership | None:
    """
    Check if a user is a member of a neighborhood.
    """
    result = await db.execute(
        select(Membership).where(
            (Membership.user_id == user_id) & (Membership.neighborhood_id == neighborhood_id)
        )
    )
    return result.scalar_one_or_none()


async def create_membership(
    db: AsyncSession, user_id: str, neighborhood_id: int
) -> Membership:
    """
    Create a membership (user joins neighborhood).
    """
    membership = Membership(user_id=user_id, neighborhood_id=neighborhood_id)
    db.add(membership)
    await db.flush()  # Flush to get the ID
    return membership


async def delete_membership(
    db: AsyncSession, user_id: str, neighborhood_id: int
) -> bool:
    """
    Delete a membership (user leaves neighborhood).
    Returns True if deleted, False if not found.
    """
    result = await db.execute(
        select(Membership).where(
            (Membership.user_id == user_id) & (Membership.neighborhood_id == neighborhood_id)
        )
    )
    membership = result.scalar_one_or_none()

    if membership:
        db.delete(membership)
        await db.flush()
        return True
    return False
