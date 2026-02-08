from fastapi import APIRouter, HTTPException, Depends, Query, status
from datetime import datetime
from typing import Optional, Dict
from models import WelcomeContentCreate, AnnouncementCreate
from auth import get_current_user
from dynamodb_client import get_table
from dynamodb_repository import (
    get_neighborhood,
    create_record,
    get_record,
    query_records,
    update_record,
    delete_record,
    now_iso
)
from atproto.cid import generate_cid
from atproto.tid import generate_rkey

router = APIRouter(prefix="/api/nbhds", tags=["nbhd-content"])


async def verify_nbhd_admin(nbhd_id: str, user_id: str) -> dict:
    """
    Verify user is admin (neighborhood creator). Returns nbhd dict.

    Args:
        nbhd_id: Neighborhood UUID
        user_id: User's DID

    Returns:
        dict: Neighborhood item

    Raises:
        HTTPException: 404 if neighborhood not found, 403 if not admin
    """
    async with get_table() as table:
        nbhd = await get_neighborhood(table, nbhd_id)
        if not nbhd:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Neighborhood not found"
            )
        if nbhd.get('created_by') != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only neighborhood admins can perform this action"
            )
    return nbhd


@router.post("/{nbhd_id}/content/welcome", status_code=status.HTTP_201_CREATED)
async def create_or_update_welcome(
    nbhd_id: str,
    content_data: WelcomeContentCreate,
    user_id: str = Depends(get_current_user)
) -> dict:
    """
    Create or update welcome content for a neighborhood.

    Welcome content is a singleton (rkey="default") - updates replace the existing one.

    Args:
        nbhd_id: Neighborhood UUID
        content_data: Welcome content (title, content)
        user_id: Admin user's DID

    Returns:
        dict: Created/updated record
    """
    # Verify admin
    nbhd = await verify_nbhd_admin(nbhd_id, user_id)

    try:
        async with get_table() as table:
            # Build record value
            value = {
                "$type": "app.nbhd.welcome",
                "nbhd_id": nbhd_id,
                "title": content_data.title,
                "content": content_data.content,
                "updated_by": user_id,
                "created_at": now_iso(),
                "updated_at": now_iso()
            }

            # Generate CID
            cid = generate_cid(value)
            rkey = "default"

            # Check if welcome content already exists
            uri = f"at://{nbhd.get('nbhd_did')}/app.nbhd.welcome/default"
            existing = await get_record(table, uri)

            if existing:
                # Update existing record
                value["created_at"] = existing["value"].get("created_at", now_iso())
                updated_cid = generate_cid(value)
                record = await update_record(table, uri, value)
            else:
                # Create new record
                record = await create_record(
                    table,
                    user_did=nbhd.get('nbhd_did'),
                    collection="app.nbhd.welcome",
                    value=value,
                    cid=cid,
                    rkey=rkey
                )

            return {
                "data": record,
                "meta": {
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                    "action": "update" if existing else "create"
                }
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create/update welcome content: {str(e)}"
        )


@router.get("/{nbhd_id}/content/welcome")
async def get_welcome(nbhd_id: str) -> dict:
    """
    Get welcome content for a neighborhood (public, no auth required).

    Args:
        nbhd_id: Neighborhood UUID

    Returns:
        dict: Welcome content record or null if not found
    """
    try:
        async with get_table() as table:
            # Verify neighborhood exists
            nbhd = await get_neighborhood(table, nbhd_id)
            if not nbhd:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Neighborhood not found"
                )

            # Fetch welcome content by URI
            uri = f"at://{nbhd.get('nbhd_did')}/app.nbhd.welcome/default"
            record = await get_record(table, uri)

            return {
                "data": record,
                "meta": {
                    "timestamp": datetime.utcnow().isoformat() + "Z"
                }
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get welcome content: {str(e)}"
        )


@router.post("/{nbhd_id}/content/announcements", status_code=status.HTTP_201_CREATED)
async def create_announcement(
    nbhd_id: str,
    announcement_data: AnnouncementCreate,
    user_id: str = Depends(get_current_user)
) -> dict:
    """
    Create a new announcement for a neighborhood.

    Args:
        nbhd_id: Neighborhood UUID
        announcement_data: Announcement content
        user_id: Admin user's DID

    Returns:
        dict: Created announcement record
    """
    # Verify admin
    nbhd = await verify_nbhd_admin(nbhd_id, user_id)

    try:
        async with get_table() as table:
            # Generate rkey (TID format for chronological ordering)
            rkey = generate_rkey()

            # Build record value
            value = {
                "$type": "app.nbhd.announcement",
                "nbhd_id": nbhd_id,
                "title": announcement_data.title,
                "content": announcement_data.content,
                "priority": announcement_data.priority or "normal",
                "pinned": announcement_data.pinned or False,
                "created_by": user_id,
                "created_at": now_iso()
            }

            # Generate CID
            cid = generate_cid(value)

            # Create record
            record = await create_record(
                table,
                user_did=nbhd.get('nbhd_did'),
                collection="app.nbhd.announcement",
                value=value,
                cid=cid,
                rkey=rkey
            )

            return {
                "data": record,
                "meta": {
                    "timestamp": datetime.utcnow().isoformat() + "Z"
                }
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create announcement: {str(e)}"
        )


@router.get("/{nbhd_id}/content/announcements")
async def list_announcements(
    nbhd_id: str,
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0)
) -> dict:
    """
    List announcements for a neighborhood (public, no auth required).

    Args:
        nbhd_id: Neighborhood UUID
        limit: Number of announcements per page (1-100, default 10)
        offset: Pagination offset (default 0)

    Returns:
        dict: Paginated list of announcements
    """
    try:
        async with get_table() as table:
            # Verify neighborhood exists
            nbhd = await get_neighborhood(table, nbhd_id)
            if not nbhd:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Neighborhood not found"
                )

            # Query all announcements for this neighborhood
            records = await query_records(
                table,
                user_did=nbhd.get('nbhd_did'),
                collection="app.nbhd.announcement"
            )

            # Filter out soft-deleted announcements
            records = [r for r in records if not r.get('deleted_at')]

            # Apply pagination
            total = len(records)
            paginated_records = records[offset : offset + limit]

            return {
                "data": paginated_records,
                "meta": {
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                    "pagination": {
                        "offset": offset,
                        "limit": limit,
                        "total": total
                    }
                }
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list announcements: {str(e)}"
        )


@router.delete("/{nbhd_id}/content/announcements/{rkey}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_announcement(
    nbhd_id: str,
    rkey: str,
    user_id: str = Depends(get_current_user)
):
    """
    Delete (soft delete) an announcement.

    Args:
        nbhd_id: Neighborhood UUID
        rkey: Announcement record key
        user_id: Admin user's DID
    """
    # Verify admin
    nbhd = await verify_nbhd_admin(nbhd_id, user_id)

    try:
        async with get_table() as table:
            # Build URI and verify record exists
            uri = f"at://{nbhd.get('nbhd_did')}/app.nbhd.announcement/{rkey}"
            record = await get_record(table, uri)

            if not record:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Announcement '{rkey}' not found"
                )

            # Verify record belongs to this neighborhood
            if record.get('value', {}).get('nbhd_id') != nbhd_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Announcement does not belong to this neighborhood"
                )

            # Soft delete
            await delete_record(table, uri)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete announcement: {str(e)}"
        )


@router.get("/{nbhd_id}/content/cms")
async def get_cms_view(
    nbhd_id: str,
    user_id: str = Depends(get_current_user)
) -> dict:
    """
    Get complete CMS view with all content (admin only).

    Returns aggregated welcome content and all announcements.

    Args:
        nbhd_id: Neighborhood UUID
        user_id: Admin user's DID

    Returns:
        dict: Aggregated content view
    """
    # Verify admin
    nbhd = await verify_nbhd_admin(nbhd_id, user_id)

    try:
        async with get_table() as table:
            # Fetch welcome content
            welcome_uri = f"at://{nbhd.get('nbhd_did')}/app.nbhd.welcome/default"
            welcome = await get_record(table, welcome_uri)

            # Fetch all announcements
            announcements = await query_records(
                table,
                user_did=nbhd.get('nbhd_did'),
                collection="app.nbhd.announcement"
            )

            # Filter out soft-deleted announcements
            announcements = [a for a in announcements if not a.get('deleted_at')]

            return {
                "data": {
                    "nbhd_id": nbhd_id,
                    "nbhd_name": nbhd.get('name'),
                    "nbhd_did": nbhd.get('nbhd_did'),
                    "welcome_content": welcome,
                    "announcements": announcements,
                    "announcement_count": len(announcements)
                },
                "meta": {
                    "timestamp": datetime.utcnow().isoformat() + "Z"
                }
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get CMS view: {str(e)}"
        )
