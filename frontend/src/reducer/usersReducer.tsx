import { signedUpUser, userState } from "@/types";

const initialUser: signedUpUser = {
  fname: '',
  lname: '',
  phoneNum: '',
}

export const UsersState: userState = {
  fname: "",
  lname: "",
  phoneNum: "",
  setFname: () => {},
  setLname: () => {},
  setPhoneNum: () => {},
  getUser: async () => initialUser,
  removeUser: async () => false,
  signUpUser: async () => false,
};

interface IAction {
  type: string;
  payload: any;
}

export const UsersReducer = (
  state: userState,
  action: IAction
): userState => {
  const { type, payload } = action;

  switch (type) {
    case "SET_USER":
      return {
        ...state,
        fname: payload.fname,
        lname: payload.lname,
        phoneNum: payload.phoneNum,
      };
    default:
      return state;
  }
};