import pathlib
from typing import Annotated
from fastapi import Depends, FastAPI
from starlette.middleware.cors import CORSMiddleware
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from chainlit.user import User as ChainlitUser
from chainlit.server import _authenticate_user
from chainlit.utils import mount_chainlit


from .models import __beanie_models__
from .models.user import User
from .routes.group import group_router
from .routes.document import document_router
from .routes.user import user_router
from .routes.auth import auth_router, get_current_user
from .routes.upload import upload_document_router

from .conf import mongo_conn_str

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    client = AsyncIOMotorClient(mongo_conn_str)
    await init_beanie(database=client.db_name, document_models=__beanie_models__)


@auth_router.get("/chainlit")
async def custom_auth(current_user: Annotated[User, Depends(get_current_user)]):
    # Verify the user's identity with custom logic.
    cl_user = ChainlitUser(identifier=current_user.phone_num)
    return await _authenticate_user(cl_user)


cl_path = pathlib.Path(__file__).parent.resolve() / "chat" / "cl_app.py"

mount_chainlit(app=app, target=str(cl_path), path="/chainlit")
app.include_router(group_router, prefix="/groups", tags=["group"])
app.include_router(document_router, prefix="/documents", tags=["document"])
app.include_router(user_router, prefix="/users", tags=["user"])
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(upload_document_router, prefix="/upload", tags=["upload document"])
