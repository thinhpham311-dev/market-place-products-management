import { combineReducers } from "@reduxjs/toolkit";
import session from "./sessionSlice";
import user from "./userSlice";
import accounts from "./accountsSlice";

const reducer = combineReducers({
  session,
  user,
  accounts,
});

export default reducer;
