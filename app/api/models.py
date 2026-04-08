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
    nbhd_did: Optional[str] = None  # DID for AT Protocol compatibility
    settings: Optional[Dict] = {}  # Neighborhood settings (is_home_page, etc)

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

from pydantic import model_validator
from typing import Literal

class SiteCreate(BaseModel):
    """Schema for creating a new site."""

    title: str
    template: str
    config: Dict = {}
    site_type: Literal["personal", "project", "nbhd"] = "personal"
    nbhd_id: Optional[str] = None

    @model_validator(mode='after')
    def validate_nbhd_id_requirement(self):
        """Validate nbhd_id based on site_type."""
        if self.site_type in ['project', 'nbhd'] and not self.nbhd_id:
            raise ValueError(f'nbhd_id required for {self.site_type} sites')
        if self.site_type == 'personal' and self.nbhd_id:
            raise ValueError('nbhd_id not allowed for personal sites')
        return self

    class Config:
        from_attributes = True


class SiteUpdate(BaseModel):
    """Schema for updating a site."""

    title: Optional[str] = None
    tagline: Optional[str] = None
    visibility: Optional[str] = None  # "public" or "private"
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
    site_type: Literal["personal", "project", "nbhd"] = "personal"
    nbhd_id: Optional[str] = None
    url: Optional[str] = None

    class Config:
        from_attributes = True


# Custom Template Models

class CustomTemplateCreate(BaseModel):
    """Schema for registering a custom template."""

    name: str
    github_url: str
    is_public: bool = False

    class Config:
        from_attributes = True


class CustomTemplateRegistrationResponse(BaseModel):
    """Schema for custom template registration response (202 Accepted)."""

    template_id: str
    status: str = "analyzing"
    message: str = "Template analysis started"
    poll_url: Optional[str] = None

    class Config:
        from_attributes = True


class CustomTemplateStatusResponse(BaseModel):
    """Schema for custom template status response."""

    template_id: str
    status: str  # analyzing, ready, failed
    progress: Optional[float] = None
    message: Optional[str] = None
    error: Optional[str] = None
    schema: Optional[Dict] = None
    content_types: Optional[Dict] = None

    class Config:
        from_attributes = True


class ContentTypeResponse(BaseModel):
    """Schema for content type information."""

    directory: str
    schema: Dict
    example_fields: Optional[Dict] = None

    class Config:
        from_attributes = True


class TemplateContentTypesResponse(BaseModel):
    """Schema for template content types response."""

    template_id: str
    content_types: Dict[str, ContentTypeResponse]

    class Config:
        from_attributes = True


# Build Job Models

class BuildJobCreate(BaseModel):
    """Schema for creating a build job."""

    site_id: str
    trigger: str = "manual"  # manual, content_update, config_update

    class Config:
        from_attributes = True


class BuildJobResponse(BaseModel):
    """Schema for build job responses."""

    job_id: str
    site_id: str
    user_did: str
    status: str  # pending, running, completed, failed
    started_at: str
    completed_at: Optional[str] = None
    duration_seconds: Optional[int] = None
    output_url: Optional[str] = None
    error: Optional[str] = None
    error_stage: Optional[str] = None
    trigger: str = "manual"
    content_count: Optional[int] = None

    class Config:
        from_attributes = True


class BuildJobListResponse(BaseModel):
    """Schema for listing build jobs."""

    builds: List[BuildJobResponse]

    class Config:
        from_attributes = True


# Neighborhood Content Models

class WelcomeContentCreate(BaseModel):
    """Schema for creating/updating welcome content."""

    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1, max_length=10000)

    class Config:
        from_attributes = True


class AnnouncementCreate(BaseModel):
    """Schema for creating announcements."""

    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1, max_length=5000)
    priority: Optional[Literal["low", "normal", "high"]] = "normal"
    pinned: Optional[bool] = False

    class Config:
        from_attributes = True
