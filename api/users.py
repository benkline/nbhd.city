"""
User profile API endpoints.
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict
from auth import verify_token
from dynamodb_client import get_table
from dynamodb_repository import (
    create_user_profile,
    get_user_profile,
    update_user_profile,
    get_user_profiles_batch,
    list_all_users
)
from models import User, UserProfileCreate, UserProfileUpdate, UserBatchRequest

router = APIRouter()


@router.get("/me", response_model=User)
async def get_my_profile(user_id: str = Depends(verify_token)):
    """
    Get current user's full profile.
    Returns 404 if profile doesn't exist (needs onboarding).
    """
    async with get_table() as table:
        profile = await get_user_profile(table, user_id)

        if not profile:
            raise HTTPException(
                status_code=404,
                detail="User profile not found. Please complete onboarding."
            )

        return User(
            id=profile["user_id"],
            handle=profile["handle"],
            display_name=profile.get("display_name"),
            avatar=profile.get("avatar"),
            bio=profile.get("bio"),
            location=profile.get("location"),
            email=profile.get("email"),
            created_at=profile.get("created_at"),
            updated_at=profile.get("updated_at")
        )


@router.post("/me/profile", response_model=User, status_code=201)
async def create_my_profile(
    profile_data: UserProfileCreate,
    user_id: str = Depends(verify_token)
):
    """
    Create user profile (onboarding).
    This is called after first login to set up the user's profile.
    """
    # Get user's BlueSky handle from token (you may need to enhance verify_token to return this)
    # For now, we'll use user_id as handle if not provided
    handle = user_id.split(":")[-1] if ":" in user_id else user_id

    async with get_table() as table:
        try:
            profile = await create_user_profile(
                table,
                user_id=user_id,
                handle=handle,
                display_name=profile_data.display_name,
                avatar=profile_data.avatar,
                bio=profile_data.bio,
                location=profile_data.location,
                email=profile_data.email
            )

            return User(
                id=profile["user_id"],
                handle=profile["handle"],
                display_name=profile.get("display_name"),
                avatar=profile.get("avatar"),
                bio=profile.get("bio"),
                location=profile.get("location"),
                email=profile.get("email"),
                created_at=profile.get("created_at"),
                updated_at=profile.get("updated_at")
            )
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))


@router.put("/me", response_model=User)
async def update_my_profile(
    profile_data: UserProfileUpdate,
    user_id: str = Depends(verify_token)
):
    """
    Update current user's profile.
    """
    async with get_table() as table:
        # Build update kwargs from provided fields
        update_kwargs = {}
        if profile_data.display_name is not None:
            update_kwargs["display_name"] = profile_data.display_name
        if profile_data.avatar is not None:
            update_kwargs["avatar"] = profile_data.avatar
        if profile_data.bio is not None:
            update_kwargs["bio"] = profile_data.bio
        if profile_data.location is not None:
            update_kwargs["location"] = profile_data.location
        if profile_data.email is not None:
            update_kwargs["email"] = profile_data.email

        if not update_kwargs:
            raise HTTPException(status_code=400, detail="No fields to update")

        profile = await update_user_profile(table, user_id, **update_kwargs)

        if not profile:
            raise HTTPException(status_code=404, detail="User profile not found")

        return User(
            id=profile["user_id"],
            handle=profile["handle"],
            display_name=profile.get("display_name"),
            avatar=profile.get("avatar"),
            bio=profile.get("bio"),
            location=profile.get("location"),
            email=profile.get("email"),
            created_at=profile.get("created_at"),
            updated_at=profile.get("updated_at")
        )


@router.get("/{user_id}", response_model=User)
async def get_user_by_id(user_id: str):
    """
    Get any user's public profile by their user ID.
    """
    async with get_table() as table:
        profile = await get_user_profile(table, user_id)

        if not profile:
            raise HTTPException(status_code=404, detail="User not found")

        return User(
            id=profile["user_id"],
            handle=profile["handle"],
            display_name=profile.get("display_name"),
            avatar=profile.get("avatar"),
            bio=profile.get("bio"),
            location=profile.get("location"),
            email=profile.get("email"),
            created_at=profile.get("created_at"),
            updated_at=profile.get("updated_at")
        )


@router.post("/batch", response_model=Dict[str, User])
async def batch_get_users(request: UserBatchRequest):
    """
    Batch get multiple user profiles.
    Used for displaying member lists with avatars/names.
    Returns a dictionary mapping user_id to User object.
    """
    async with get_table() as table:
        profiles_dict = await get_user_profiles_batch(table, request.user_ids)

        # Convert to User objects
        result = {}
        for user_id, profile in profiles_dict.items():
            result[user_id] = User(
                id=profile["user_id"],
                handle=profile["handle"],
                display_name=profile.get("display_name"),
                avatar=profile.get("avatar"),
                bio=profile.get("bio"),
                location=profile.get("location"),
                email=profile.get("email"),
                created_at=profile.get("created_at"),
                updated_at=profile.get("updated_at")
            )

        return result


@router.get("/", response_model=List[User])
async def list_users(limit: int = 100, last_key: str = None):
    """
    List all users (paginated).
    """
    async with get_table() as table:
        # Parse last_key if provided (would need to be base64 encoded in practice)
        last_key_dict = None
        if last_key:
            import json
            import base64
            try:
                last_key_dict = json.loads(base64.b64decode(last_key))
            except:
                pass

        users, next_key = await list_all_users(table, limit, last_key_dict)

        return [
            User(
                id=user["user_id"],
                handle=user["handle"],
                display_name=user.get("display_name"),
                avatar=user.get("avatar"),
                bio=user.get("bio"),
                location=user.get("location"),
                email=user.get("email"),
                created_at=user.get("created_at"),
                updated_at=user.get("updated_at")
            )
            for user in users
        ]
