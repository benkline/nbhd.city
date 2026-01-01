"""
API endpoints for nbhds and membership management.
Updated for DynamoDB.
"""

from fastapi import APIRouter, HTTPException, status, Depends
from typing import Optional

from auth import get_current_user
from dynamodb_client import get_table
from dynamodb_repository import (
    create_membership,
    create_neighborhood,
    delete_membership,
    get_membership,
    get_neighborhood,
    get_neighborhood_with_members,
    list_neighborhoods,
    get_user_memberships,
)
from models import (
    NbhdCreate,
    NbhdDetailResponse,
    NbhdResponse,
    UserMembershipsResponse,
    MembershipResponse,
)

router = APIRouter()


@router.get("/api/nbhds", response_model=list[NbhdResponse])
async def list_nbhds(limit: int = 100, last_key: Optional[str] = None):
    """
    Get all nbhds with pagination.
    Public endpoint - no authentication required.
    """
    async with get_table() as table:
        nbhds, next_key = await list_neighborhoods(table, limit, last_key)
        return nbhds


@router.get("/api/nbhds/{nbhd_id}", response_model=NbhdDetailResponse)
async def get_nbhd_detail(nbhd_id: str):
    """
    Get nbhd details with member list.
    Public endpoint - no authentication required.
    """
    async with get_table() as table:
        nbhd, members = await get_neighborhood_with_members(table, nbhd_id)

        if not nbhd:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Nbhd with id {nbhd_id} not found",
            )

        # Convert memberships to response model
        member_responses = [
            MembershipResponse(
                id=m["SK"].replace("MEMBER#", ""),  # Extract user_id from SK
                user_id=m["user_id"],
                joined_at=m["joined_at"],
            )
            for m in members
        ]

        return NbhdDetailResponse(
            id=nbhd["id"],
            name=nbhd["name"],
            description=nbhd["description"],
            created_by=nbhd["created_by"],
            created_at=nbhd["created_at"],
            member_count=nbhd.get("member_count", 0),
            members=member_responses,
        )


@router.post("/api/nbhds", response_model=NbhdResponse, status_code=201)
async def create_new_nbhd(
    nbhd_data: NbhdCreate,
    user_id: str = Depends(get_current_user),
):
    """
    Create a new nbhd.
    Requires authentication. Creator is automatically added as first member.
    """
    async with get_table() as table:
        try:
            # Create nbhd
            nbhd = await create_neighborhood(
                table, nbhd_data.name, nbhd_data.description, user_id
            )

            # Auto-join the creator
            await create_membership(table, user_id, nbhd["id"])

            return NbhdResponse(
                id=nbhd["id"],
                name=nbhd["name"],
                description=nbhd["description"],
                created_by=nbhd["created_by"],
                created_at=nbhd["created_at"],
                member_count=1,
            )

        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=str(e)
            )


@router.get("/api/users/me/nbhds", response_model=UserMembershipsResponse)
async def get_my_nbhds(user_id: str = Depends(get_current_user)):
    """
    Get nbhds that the current user is a member of.
    Requires authentication.
    """
    async with get_table() as table:
        nbhds = await get_user_memberships(table, user_id)
        return UserMembershipsResponse(neighborhoods=nbhds)


@router.post("/api/nbhds/{nbhd_id}/join", status_code=201)
async def join_nbhd(nbhd_id: str, user_id: str = Depends(get_current_user)):
    """
    Join a nbhd.
    Requires authentication.
    """
    async with get_table() as table:
        # Check nbhd exists
        nbhd = await get_neighborhood(table, nbhd_id)
        if not nbhd:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Nbhd with id {nbhd_id} not found",
            )

        try:
            # Create membership
            await create_membership(table, user_id, nbhd_id)

            return {
                "message": "Successfully joined nbhd",
                "nbhd_id": nbhd_id,
            }

        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=str(e)
            )


@router.delete("/api/nbhds/{nbhd_id}/leave", status_code=204)
async def leave_nbhd(nbhd_id: str, user_id: str = Depends(get_current_user)):
    """
    Leave a nbhd.
    Requires authentication.
    """
    async with get_table() as table:
        deleted = await delete_membership(table, user_id, nbhd_id)

        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="You are not a member of this nbhd",
            )

        return None
