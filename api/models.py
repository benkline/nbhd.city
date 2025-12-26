from pydantic import BaseModel
from typing import Optional
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
