from datetime import datetime, timedelta
from typing import Annotated, Optional

from beanie import Document as BeanieDocument
from pydantic import Field, BaseModel
from pydantic.functional_validators import AfterValidator
import phonenumbers


class OneTimePassword(BaseModel):
    pin: int
    used: bool = False
    expiration: datetime = Field(
        default_factory=lambda: datetime.now() + timedelta(minutes=2)
    )


def phone_number_val_parse(phone_num: str) -> str:  # TODO: edge case: "+98"
    phone_num_parsed = phonenumbers.parse(phone_num, "IR")
    return phonenumbers.format_number(
        phone_num_parsed, phonenumbers.PhoneNumberFormat.E164
    )


PhoneNumber = Annotated[str, AfterValidator(phone_number_val_parse)]


class User(BeanieDocument):
    creation_ts: datetime = Field(default_factory=datetime.now)
    fname: str
    lname: str
    phone_num: PhoneNumber  # TODO: must be indexed
    phone_num_activated: bool = False
    otp: Optional[OneTimePassword] = None

    class Settings:
        name = "users"
        is_root = True


class UserResponse(BaseModel):
    fname: str
    lname: str
    phone_num: PhoneNumber
