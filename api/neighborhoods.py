"""
API endpoints for nbhds and membership management.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from crud import (
    create_membership,
    create_nbhd,
    delete_membership,
    get_membership,
    get_nbhd,
    get_nbhd_with_members,
    get_nbhds,
    get_user_memberships,
)
from database import get_db
from models import (
    NbhdCreate,
    NbhdDetailResponse,
    NbhdResponse,
    UserMembershipsResponse,
    MembershipResponse,
)
from db_models import Membership

router = APIRouter()


@router.get("/api/nbhds", response_model=list[NbhdResponse])
async def list_nbhds(
    skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)
):
    """
    Get all nbhds with pagination.
    Public endpoint - no authentication required.
    """
    nbhds = await get_nbhds(db, skip=skip, limit=limit)
    return nbhds


@router.get("/api/nbhds/{nbhd_id}", response_model=NbhdDetailResponse)
async def get_nbhd_detail(
    nbhd_id: int, db: AsyncSession = Depends(get_db)
):
    """
    Get nbhd details with member list.
    Public endpoint - no authentication required.
    """
    nbhd = await get_nbhd_with_members(db, nbhd_id)

    if not nbhd:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nbhd with id {nbhd_id} not found",
        )

    # Get member count for response
    member_count = len(nbhd.memberships)

    # Convert memberships to response model
    members = [
        MembershipResponse(
            id=membership.id,
            user_id=membership.user_id,
            joined_at=membership.joined_at,
        )
        for membership in nbhd.memberships
    ]

    return NbhdDetailResponse(
        id=nbhd.id,
        name=nbhd.name,
        description=nbhd.description,
        created_by=nbhd.created_by,
        created_at=nbhd.created_at,
        member_count=member_count,
        members=members,
    )


@router.post("/api/nbhds", response_model=NbhdResponse, status_code=201)
async def create_new_nbhd(
    nbhd_data: NbhdCreate,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new nbhd.
    Requires authentication. Creator is automatically added as first member.
    """
    try:
        # Create nbhd
        nbhd = await create_nbhd(
            db, nbhd_data.name, nbhd_data.description, user_id
        )

        # Auto-join the creator
        await create_membership(db, user_id, nbhd.id)

        # Commit transaction
        await db.commit()

        # Return response (no members yet except creator)
        return NbhdResponse(
            id=nbhd.id,
            name=nbhd.name,
            description=nbhd.description,
            created_by=nbhd.created_by,
            created_at=nbhd.created_at,
            member_count=1,
        )

    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A nbhd with this name already exists",
        )


@router.get("/api/users/me/nbhds", response_model=UserMembershipsResponse)
async def get_my_nbhds(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get nbhds that the current user is a member of.
    Requires authentication.
    """
    nbhds = await get_user_memberships(db, user_id)
    return UserMembershipsResponse(neighborhoods=nbhds)


@router.post("/api/nbhds/{nbhd_id}/join", status_code=201)
async def join_nbhd(
    nbhd_id: int,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Join a nbhd.
    Requires authentication.
    """
    # Check nbhd exists
    nbhd = await get_nbhd(db, nbhd_id)
    if not nbhd:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nbhd with id {nbhd_id} not found",
        )

    # Check if already a member
    existing_membership = await get_membership(db, user_id, nbhd_id)
    if existing_membership:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You are already a member of this nbhd",
        )

    try:
        # Create membership
        await create_membership(db, user_id, nbhd_id)
        await db.commit()

        return {
            "message": "Successfully joined nbhd",
            "nbhd_id": nbhd_id,
        }

    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to join nbhd",
        )


@router.delete("/api/nbhds/{nbhd_id}/leave", status_code=204)
async def leave_nbhd(
    nbhd_id: int,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Leave a nbhd.
    Requires authentication.
    """
    # Check if user is a member
    membership = await get_membership(db, user_id, nbhd_id)
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You are not a member of this nbhd",
        )

    try:
        await delete_membership(db, user_id, nbhd_id)
        await db.commit()
        return None

    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to leave nbhd",
        )
