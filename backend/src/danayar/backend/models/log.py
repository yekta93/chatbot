from enum import Enum
from typing import Annotated, List, Optional
from datetime import datetime

from beanie import Indexed, Document as BeanieDocument, PydanticObjectId
from pydantic import Field, BaseModel


class Log(BeanieDocument):
    creation_ts: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "logs"
        is_root = True


class TokenUsageLog(Log):
    user_identifier: str
    exec_id: str
    func_info: dict
    llm_output: dict
    metadata: Optional[dict] = None
