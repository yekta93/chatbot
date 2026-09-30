from enum import Enum
from typing import Annotated, List, Optional
from datetime import datetime

from beanie import Indexed, Document as BeanieDocument, PydanticObjectId
from pydantic import Field, BaseModel


class Group(BeanieDocument):
    creation_ts: datetime = Field(default_factory=datetime.now)
    name: str
    description: str
    empty: bool = Field(default=False)
    owner: str = Field(default="organization")
    children: List[PydanticObjectId] = Field(default_factory=list)
    default: bool = Field(default=False)
    tags: Annotated[Optional[List[str]], Indexed()] = Field(default=None)

    class Settings:
        name = "groups"
        is_root = True


class DocumentGroup(Group):
    filter_tags: List[str]


class DatabaseGroup(Group):
    pass


class DashboardGroup(Group):
    pass


class GroupType(str, Enum):
    dashboard = "DashboardGroup"
    document = "DocumentGroup"
    database = "DatabaseGroup"


class GroupResponse(BaseModel):
    group_id: PydanticObjectId
    name: str
    description: str
    type: GroupType
    resolve_to: str
