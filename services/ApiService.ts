import BaseService from "./BaseService";
import type { AxiosRequestConfig, AxiosResponse } from "axios";

const ApiService = {
  fetchData<T = unknown>(param: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return BaseService(param);
  },
};

export default ApiService;
