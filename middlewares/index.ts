import { Middleware } from "@reduxjs/toolkit";

export const smartCacheMiddleware: Middleware = () => (next) => (action) => {
  return next(action);
};

export const dynamicInitMiddleware: Middleware = () => (next) => (action) => {
  return next(action);
};
