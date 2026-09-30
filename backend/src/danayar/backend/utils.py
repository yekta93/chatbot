def gen_details_for_exception(msg: str, input: str = ""):
    return [
        {
            "type": "custom_error",
            "loc": [],
            "msg": msg,
            "input": input,
            "ctx": {"error": {}},
        }
    ]
