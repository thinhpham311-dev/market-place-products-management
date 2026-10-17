import { combineReducers } from "@reduxjs/toolkit";

import language from "./languageSlice";
import theme from "./themeSlice";

const reducer = combineReducers({
  language,
  theme,
});

export default reducer;
