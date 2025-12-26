"""
API endpoints for neighborhoods and membership management.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from crud import (
    create_membership,
    create_neighborhood,
    delete_membership,
    get_membership,
    get_neighborhood,
    get_neighborhood_with_members,
    get_neighborhoods,
    get_user_memberships,
)
from database import get_db
from models import (
    NeighborhoodCreate,
    NeighborhoodDetailResponse,
    NeighborhoodResponse,
    UserMembershipsResponse,
    MembershipResponse,
)
from db_models import Membership

router = APIRouter()


@router.get("/api/neighborhoods", response_model=list[NeighborhoodResponse])
async def list_neighborhoods(
    skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)
):
    """
    Get all neighborhoods with pagination.
    Public endpoint - no authentication required.
    """
    neighborhoods = await get_neighborhoods(db, skip=skip, limit=limit)
    return neighborhoods


@router.get("/api/neighborhoods/{neighborhood_id}", response_model=NeighborhoodDetailResponse)
async def get_neighborhood_detail(
    neighborhood_id: int, db: AsyncSession = Depends(get_db)
):
    """
    Get neighborhood details with member list.
    Public endpoint - no authentication required.
    """
    neighborhood = await get_neighborhood_with_members(db, neighborhood_id)

    if not neighborhood:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Neighborhood with id {neighborhood_id} not found",
        )

    # Get member count for response
    member_count = len(neighborhood.memberships)

    # Convert memberships to response model
    members = [
        MembershipResponse(
            id=membership.id,
            user_id=membership.user_id,
            joined_at=membership.joined_at,
        )
        for membership in neighborhood.memberships
    ]

    return NeighborhoodDetailResponse(
        id=neighborhood.id,
        name=neighborhood.name,
        description=neighborhood.description,
        created_by=neighborhood.created_by,
        created_at=neighborhood.created_at,
        member_count=member_count,
        members=members,
    )


@router.post("/api/neighborhoods", response_model=NeighborhoodResponse, status_code=201)
async def create_new_neighborhood(
    neighborhood_data: NeighborhoodCreate,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new neighborhood.
    Requires authentication. Creator is automatically added as first member.
    """
    try:
        # Create neighborhood
        neighborhood = await create_neighborhood(
            db, neighborhood_data.name, neighborhood_data.description, user_id
        )

        # Auto-join the creator
        await create_membership(db, user_id, neighborhood.id)

        # Commit transaction
        await db.commit()

        # Return response (no members yet except creator)
        return NeighborhoodResponse(
            id=neighborhood.id,
            name=neighborhood.name,
            description=neighborhood.description,
            created_by=neighborhood.created_by,
            created_at=neighborhood.created_at,
            member_count=1,
        )

    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A neighborhood with this name already exists",
        )


@router.get("/api/users/me/neighborhoods", response_model=UserMembershipsResponse)
async def get_my_neighborhoods(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get neighborhoods that the current user is a member of.
    Requires authentication.
    """
    neighborhoods = await get_user_memberships(db, user_id)
    return UserMembershipsResponse(neighborhoods=neighborhoods)


@router.post("/api/neighborhoods/{neighborhood_id}/join", status_code=201)
async def join_neighborhood(
    neighborhood_id: int,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Join a neighborhood.
    Requires authentication.
    """
    # Check neighborhood exists
    neighborhood = await get_neighborhood(db, neighborhood_id)
    if not neighborhood:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Neighborhood with id {neighborhood_id} not found",
        )

    # Check if already a member
    existing_membership = await get_membership(db, user_id, neighborhood_id)
    if existing_membership:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You are already a member of this neighborhood",
        )

    try:
        # Create membership
        await create_membership(db, user_id, neighborhood_id)
        await db.commit()

        return {
            "message": "Successfully joined neighborhood",
            "neighborhood_id": neighborhood_id,
        }

    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to join neighborhood",
        )


@router.delete("/api/neighborhoods/{neighborhood_id}/leave", status_code=204)
async def leave_neighborhood(
    neighborhood_id: int,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Leave a neighborhood.
    Requires authentication.
    """
    # Check if user is a member
    membership = await get_membership(db, user_id, neighborhood_id)
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You are not a member of this neighborhood",
        )

    try:
        await delete_membership(db, user_id, neighborhood_id)
        await db.commit()
        return None

    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to leave neighborhood",
        )
