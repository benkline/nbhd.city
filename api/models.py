from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class User(BaseModel):
    id: str  # BlueSky DID
    handle: str
    display_name: Optional[str] = None
    avatar: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User


class TokenPayload(BaseModel):
    sub: str  # User ID (DID)
    exp: int  # Expiration time
    iat: int  # Issued at


class BlueSkyAuthResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    did: str
    handle: str


# Neighborhood Models

class NeighborhoodCreate(BaseModel):
    """Schema for creating a new neighborhood."""

    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=1000)


class MembershipResponse(BaseModel):
    """Schema for membership information in responses."""

    id: int
    user_id: str
    joined_at: datetime

    class Config:
        from_attributes = True


class NeighborhoodResponse(BaseModel):
    """Schema for neighborhood list responses."""

    id: int
    name: str
    description: Optional[str]
    created_by: str
    created_at: datetime
    member_count: int = 0

    class Config:
        from_attributes = True


class NeighborhoodDetailResponse(NeighborhoodResponse):
    """Schema for detailed neighborhood responses with members."""

    members: List[MembershipResponse] = []


class UserMembershipsResponse(BaseModel):
    """Schema for user's neighborhood memberships."""

    neighborhoods: List[NeighborhoodResponse]
