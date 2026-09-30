from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status

from backend.models.user import User, UserResponse, PhoneNumber
from backend.routes.auth import (
    get_current_user,
    send_one_time_password,
    validate_one_time_password,
)
from backend.utils import gen_details_for_exception

user_router = APIRouter()


@user_router.get("/me", response_model=UserResponse)
async def get_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> UserResponse:

    return UserResponse(
        fname=current_user.fname,
        lname=current_user.lname,
        phone_num=current_user.phone_num,
    )


@user_router.post("/signup", response_model=UserResponse)
async def signup(
    phone_num: PhoneNumber,
    fname: str,
    lname: str,
) -> UserResponse:

    if user := await User.find(User.phone_num == phone_num).first_or_none():
        if user.phone_num_activated:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=gen_details_for_exception(
                    "Phone number already activated and associated with an existing user."
                ),
            )

        await User.find_all(User.phone_num == phone_num).delete()

    user = User(
        phone_num=phone_num,
        fname=fname,
        lname=lname,
    )

    await user.insert()

    return UserResponse(
        fname=user.fname,
        lname=user.lname,
        phone_num=user.phone_num,
    )


# TODO: It should be removed in production
@user_router.delete("/{phone_num}")
async def remove_user(
    current_user: Annotated[User, Depends(get_current_user)],
    phone_num: PhoneNumber,
) -> bool:
    await User.find_all(User.phone_num == phone_num).delete()
    return True
