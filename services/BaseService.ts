import axios from "axios";
import appConfig from "@/configs/app.config";
import { TOKEN_TYPE, REQUEST_HEADER_AUTH_KEY } from "@/constants/api/api.constant";
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
    const accessToken = store.getState()?.auth?.session?.token;
    if (accessToken) {
      config.headers[REQUEST_HEADER_AUTH_KEY] = `${TOKEN_TYPE}${accessToken}`;
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
