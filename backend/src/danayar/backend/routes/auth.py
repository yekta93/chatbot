from typing import Tuple
from datetime import datetime
from datetime import datetime, timedelta, timezone
import random
from typing import Annotated, Tuple

import jwt
import httpx
from fastapi import Depends, HTTPException, status, APIRouter
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jwt.exceptions import InvalidTokenError
from pydantic import BaseModel


from ..models.user import (
    User,
    PhoneNumber,
    OneTimePassword,
    phone_number_val_parse,
)
from ..conf import sms_api_info, jwt_conf
from ..utils import gen_details_for_exception


auth_router = APIRouter()


async def send_one_time_password(user: User):
    code = random.randint(10000, 99999)
    payload = {
        "mobile": user.phone_num,
        "templateId": sms_api_info["template_id"],
        "parameters": [{"name": "LOGIN_CODE", "value": str(code)}],
    }
    headers = {
        "Content-Type": "application/json",
        "Accept": "text/plain",
        "x-api-key": sms_api_info["api_key"],
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(sms_api_info["url"], json=payload, headers=headers)

        if response.status_code != 200:
            print(
                f">>>> failed to send OTP. code:{response.status_code} text:{response.text}"
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=gen_details_for_exception("Failed to send OTP."),
            )

    user.otp = OneTimePassword(pin=code)
    await user.save()


async def validate_one_time_password(user: User, code: int) -> Tuple[bool, str]:
    otp = user.otp

    if otp is None:
        return False, "No one-time password has been sent yet."

    if otp.expiration < datetime.now():
        return False, "Your password is expired."

    if otp.pin != code:
        return False, "The code is incorrect."

    if otp.used:
        return False, "This password has already been used."

    otp.used = True
    await user.save()

    return True, ""


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    phone_num: PhoneNumber


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, jwt_conf["SECRET_KEY"], algorithm=jwt_conf["ALGORITHM"]
    )
    return encoded_jwt


async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=gen_details_for_exception("Could not validate credentials"),
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, jwt_conf["SECRET_KEY"], algorithms=[jwt_conf["ALGORITHM"]]
        )
        phone_num: str = payload.get("phone_num")
        if phone_num is None:
            raise credentials_exception
        token_data = TokenData(phone_num=phone_num)
    except InvalidTokenError as e:
        raise credentials_exception
    user = await User.find(User.phone_num == token_data.phone_num).first_or_none()
    if user is None:
        raise credentials_exception
    return user


@auth_router.post("/token")
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
) -> Token:
    try:
        phone_number = phone_number_val_parse(form_data.username)
        code = int(form_data.password)
    except:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=gen_details_for_exception("Phone number format is wrong."),
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user := await User.find(User.phone_num == phone_number).first_or_none():

        valid, reason = await validate_one_time_password(user=user, code=code)

        if not valid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=reason,
                headers={"WWW-Authenticate": "Bearer"},
            )

        access_token_expires = timedelta(
            minutes=jwt_conf["ACCESS_TOKEN_EXPIRE_MINUTES"]
        )
        access_token = create_access_token(
            data={"phone_num": user.phone_num}, expires_delta=access_token_expires
        )

        if not user.phone_num_activated:
            user.phone_num_activated = True
            await user.save()

        return Token(access_token=access_token, token_type="bearer")

    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=gen_details_for_exception("User do not exist."),
            headers={"WWW-Authenticate": "Bearer"},
        )


@auth_router.post("/send-one-time-password")
async def send_one_time_password_to_user(
    phone_num: PhoneNumber,
) -> bool:
    if user := await User.find(User.phone_num == phone_num).first_or_none():

        if user.otp and user.otp.expiration > datetime.now():
            time_remaining = user.otp.expiration - datetime.now()

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=gen_details_for_exception(
                    "A valid OTP already exists.",
                    input=f"Time remaining: {time_remaining.seconds}",
                ),
            )

        await send_one_time_password(user)
        return True

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=gen_details_for_exception("User do not exist."),
    )
