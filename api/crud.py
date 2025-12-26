"""
CRUD operations for nbhds and memberships.
"""

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from db_models import Nbhd, Membership


async def get_nbhds(db: AsyncSession, skip: int = 0, limit: int = 100):
    """
    Get all nbhds with member count and pagination.
    """
    # Subquery to count members
    member_count_subquery = (
        select(func.count(Membership.id))
        .where(Membership.neighborhood_id == Nbhd.id)
        .correlate(Nbhd)
        .scalar_subquery()
    )

    result = await db.execute(
        select(
            Nbhd,
            member_count_subquery.label("member_count"),
        )
        .offset(skip)
        .limit(limit)
        .order_by(Nbhd.created_at.desc())
    )

    # Return nbhds with member counts
    nbhds = []
    for row in result:
        nbhd = row[0]
        nbhd.member_count = row[1] or 0
        nbhds.append(nbhd)

    return nbhds


async def get_nbhd(db: AsyncSession, nbhd_id: int) -> Nbhd | None:
    """
    Get a single nbhd by ID.
    """
    result = await db.execute(select(Nbhd).where(Nbhd.id == nbhd_id))
    return result.scalar_one_or_none()


async def get_nbhd_with_members(
    db: AsyncSession, nbhd_id: int
) -> Nbhd | None:
    """
    Get a nbhd with all its members.
    """
    result = await db.execute(
        select(Nbhd)
        .where(Nbhd.id == nbhd_id)
        .options(selectinload(Nbhd.memberships))
    )
    return result.scalar_one_or_none()


async def create_nbhd(
    db: AsyncSession, name: str, description: str | None, created_by: str
) -> Nbhd:
    """
    Create a new nbhd.
    """
    nbhd = Nbhd(
        name=name,
        description=description,
        created_by=created_by,
    )
    db.add(nbhd)
    await db.flush()  # Flush to get the ID
    return nbhd


async def get_user_memberships(db: AsyncSession, user_id: str):
    """
    Get all nbhds that a user is a member of.
    """
    # Subquery to count members
    member_count_subquery = (
        select(func.count(Membership.id))
        .where(Membership.neighborhood_id == Nbhd.id)
        .correlate(Nbhd)
        .scalar_subquery()
    )

    result = await db.execute(
        select(
            Nbhd,
            member_count_subquery.label("member_count"),
        )
        .join(Membership, Nbhd.id == Membership.neighborhood_id)
        .where(Membership.user_id == user_id)
        .order_by(Nbhd.created_at.desc())
    )

    # Return nbhds with member counts
    nbhds = []
    for row in result:
        nbhd = row[0]
        nbhd.member_count = row[1] or 0
        nbhds.append(nbhd)

    return nbhds


async def get_membership(
    db: AsyncSession, user_id: str, nbhd_id: int
) -> Membership | None:
    """
    Check if a user is a member of a nbhd.
    """
    result = await db.execute(
        select(Membership).where(
            (Membership.user_id == user_id) & (Membership.neighborhood_id == nbhd_id)
        )
    )
    return result.scalar_one_or_none()


async def create_membership(
    db: AsyncSession, user_id: str, nbhd_id: int
) -> Membership:
    """
    Create a membership (user joins nbhd).
    """
    membership = Membership(user_id=user_id, neighborhood_id=nbhd_id)
    db.add(membership)
    await db.flush()  # Flush to get the ID
    return membership


async def delete_membership(
    db: AsyncSession, user_id: str, nbhd_id: int
) -> bool:
    """
    Delete a membership (user leaves nbhd).
    Returns True if deleted, False if not found.
    """
    result = await db.execute(
        select(Membership).where(
            (Membership.user_id == user_id) & (Membership.neighborhood_id == nbhd_id)
        )
    )
    membership = result.scalar_one_or_none()

    if membership:
        db.delete(membership)
        await db.flush()
        return True
    return False
