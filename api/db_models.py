from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint, Index, func
from sqlalchemy.orm import relationship

from database import Base


class Neighborhood(Base):
    """
    Neighborhood model for storing neighborhood information.
    """

    __tablename__ = "neighborhoods"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    created_by = Column(String(255), nullable=False, index=True)  # BlueSky DID
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationship to memberships
    memberships = relationship("Membership", back_populates="neighborhood", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Neighborhood(id={self.id}, name='{self.name}', created_by='{self.created_by}')>"


class Membership(Base):
    """
    Membership model for tracking which users are members of which neighborhoods.
    """

    __tablename__ = "memberships"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(255), nullable=False, index=True)  # BlueSky DID
    neighborhood_id = Column(Integer, ForeignKey("neighborhoods.id"), nullable=False, index=True)
    joined_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationship to neighborhood
    neighborhood = relationship("Neighborhood", back_populates="memberships")

    # Ensure user can only join a neighborhood once
    __table_args__ = (
        UniqueConstraint("user_id", "neighborhood_id", name="unique_user_neighborhood_membership"),
        Index("idx_user_neighborhood", "user_id", "neighborhood_id"),
    )

    def __repr__(self):
        return f"<Membership(id={self.id}, user_id='{self.user_id}', neighborhood_id={self.neighborhood_id})>"
