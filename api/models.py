from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict
from datetime import datetime


class User(BaseModel):
    id: str  # BlueSky DID
    handle: str
    display_name: Optional[str] = None
    avatar: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    email: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True


class UserProfile(BaseModel):
    """Extended user profile with BlueSky information."""
    did: str
    handle: str
    displayName: Optional[str] = None
    description: Optional[str] = None
    avatar: Optional[str] = None
    banner: Optional[str] = None
    followersCount: int = 0
    followsCount: int = 0
    postsCount: int = 0
    viewer: Optional[Dict] = None


class UserProfileCreate(BaseModel):
    """Schema for creating a user profile."""
    display_name: Optional[str] = None
    avatar: Optional[str] = None
    bio: Optional[str] = Field(None, max_length=500)
    location: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None


class UserProfileUpdate(BaseModel):
    """Schema for updating a user profile."""
    display_name: Optional[str] = None
    avatar: Optional[str] = None
    bio: Optional[str] = Field(None, max_length=500)
    location: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None


class UserBatchRequest(BaseModel):
    """Schema for batch getting user profiles."""
    user_ids: List[str] = Field(..., max_length=100)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Optional[User] = None


class TokenPayload(BaseModel):
    sub: str  # User ID (DID)
    exp: int  # Expiration time
    iat: int  # Issued at


class BlueSkyAuthResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    did: str
    handle: str


# Nbhd Models

class MembershipResponse(BaseModel):
    """Schema for membership information in responses."""

    id: str  # Changed to UUID string
    user_id: str
    joined_at: str  # ISO format timestamp string

    class Config:
        from_attributes = True


class NbhdResponse(BaseModel):
    """Schema for nbhd list responses."""

    id: str  # Changed to UUID string
    name: str
    description: Optional[str]
    created_by: str
    created_at: str  # ISO format timestamp string
    member_count: int = 0

    class Config:
        from_attributes = True


class NbhdDetailResponse(NbhdResponse):
    """Schema for detailed nbhd responses with members."""

    members: List[MembershipResponse] = []


class UserMembershipsResponse(BaseModel):
    """Schema for user's nbhd memberships."""

    neighborhoods: List[NbhdResponse]


# Static Site Template Models

class TemplateResponse(BaseModel):
    """Schema for template metadata in list/detail responses."""

    id: str
    name: str
    description: str
    author: str
    version: str
    tags: List[str]
    preview_url: Optional[str] = None

    class Config:
        from_attributes = True


class TemplateSchemaResponse(BaseModel):
    """Schema for template configuration schema."""

    id: str
    schema: Dict

    class Config:
        from_attributes = True


# Site Models

class SiteCreate(BaseModel):
    """Schema for creating a new site."""

    title: str
    template: str
    config: Dict = {}

    class Config:
        from_attributes = True


class SiteUpdate(BaseModel):
    """Schema for updating a site."""

    title: Optional[str] = None
    config: Optional[Dict] = None

    class Config:
        from_attributes = True


class SiteResponse(BaseModel):
    """Schema for site responses."""

    site_id: str
    user_id: str
    title: str
    template: str
    status: str = "draft"
    config: Dict
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True
