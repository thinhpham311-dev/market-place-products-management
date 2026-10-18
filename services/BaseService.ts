import axios from "axios";
import appConfig from "@/configs/app.config";
import {
  TOKEN_TYPE,
  REQUEST_HEADER_AUTH_KEY,
  REQUEST_HEADER_API_KEY,
  REQUEST_HEADER_CLIENT_ID,
  API_KEY,
} from "@/constants/api/api.constant";
import store from "@/store";
import { onSignOutSuccess } from "@/store/auth/sessionSlice";
import { handleAxiosError } from "@/lib/http/handleAxiosError";

const unauthorizedCode = [401];
const baseURL = `${appConfig.apiPrefix}`;

const BaseService = axios.create({
  timeout: 60000,
  baseURL,
  withCredentials: true,
});

BaseService.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const accessToken = state?.auth?.session?.token;
    if (accessToken) {
      config.headers[REQUEST_HEADER_AUTH_KEY] = `${TOKEN_TYPE}${accessToken}`;
      config.headers["authorization"] = accessToken;
    }

    const clientId = state?.auth?.user?.id;
    if (clientId) {
      config.headers[REQUEST_HEADER_CLIENT_ID] = clientId;
    }

    const apiKey = process.env.NEXT_PUBLIC_API_KEY || API_KEY;
    if (apiKey) {
      config.headers[REQUEST_HEADER_API_KEY] = apiKey;
    }

    config.withCredentials = true;

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

BaseService.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;

    if (response && unauthorizedCode.includes(response.status)) {
      store.dispatch(onSignOutSuccess());
    }

    return Promise.reject(handleAxiosError(error));
  },
);

export default BaseService;
