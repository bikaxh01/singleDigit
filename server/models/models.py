from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Annotated
from bson import ObjectId


class User(BaseModel):
    email: str
    user_name: str
    created_at: int = int(datetime.timestamp(datetime.now()))


class Links(BaseModel):

    model_config = ConfigDict(arbitrary_types_allowed=True)
    url: str
    user_id: ObjectId
    title: str
    summary: str
    content_embedding: List[float]
    created_at: int = int(datetime.timestamp(datetime.now()))
