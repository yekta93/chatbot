import asyncio
from typing import Annotated, List, Literal

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException

from backend.models.group import Group, GroupResponse
from backend.utils import gen_details_for_exception
from backend.models.user import User
from backend.routes.auth import get_current_user

group_router = APIRouter()


def resolve_to(group: Group) -> Literal["groups", "documents"]:
    return "groups" if len(group.children) > 0 or group.empty else "documents"


async def id_to_group_response(main_id: PydanticObjectId) -> List[GroupResponse]:
    main_group = await Group.get(document_id=main_id, with_children=True)
    if main_group is None:
        raise HTTPException(
            status_code=404,
            detail=gen_details_for_exception("Group not found."),
        )

    if len(main_group.children) == 0:
        if main_group.empty:
            return []
        else:
            raise HTTPException(
                status_code=400,
                detail=gen_details_for_exception(
                    "group contains other objects, not groups."
                ),
            )

    coroutines = [Group.get(id, with_children=True) for id in main_group.children]
    groups = await asyncio.gather(*coroutines)
    res: List[GroupResponse] = []
    for g in groups:
        res.append(
            GroupResponse(
                group_id=g.id,
                name=g.name,
                description=g.description,
                type=g.__class__.__name__,
                resolve_to=resolve_to(g),
            )
        )

    return res


@group_router.get("/", response_model=List[GroupResponse])
async def get_first_page(
    current_user: Annotated[User, Depends(get_current_user)],
    personal: bool = False,
) -> List[GroupResponse]:
    main_id: PydanticObjectId = PydanticObjectId("f" * 24)
    res = await id_to_group_response(main_id)
    return res


@group_router.get("/{group_id}", response_model=List[GroupResponse])
async def get_page(
    current_user: Annotated[User, Depends(get_current_user)],
    group_id: PydanticObjectId,
    personal: bool = False,
) -> List[GroupResponse]:
    res = await id_to_group_response(group_id)
    return res
