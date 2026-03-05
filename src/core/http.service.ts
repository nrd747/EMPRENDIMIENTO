import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from "axios";

import { HttpMethod } from "@/enums";
import { IService } from "@/interfaces";
import StorageService from "./storage.service";

export default class HttpService {
  private http: AxiosInstance;
  private baseURL: string = import.meta.env.VITE_API_URL as string;
  private useMocks: boolean = (import.meta.env.VITE_USE_MOCKS as string) === "true";

  constructor() {
    if (this.useMocks) {
      const adapter = async (config: AxiosRequestConfig) => {
        const method = (config.method || "get").toLowerCase();
        const url = (config.url || "").replace(/^\//, "");
        const payload = config.data;
        const ok = (data: any, status = 200) =>
          Promise.resolve({
            data,
            status,
            statusText: "OK",
            headers: {},
            config,
            request: {},
          } as AxiosResponse);
        if (method === "post" && url === "auth/login") {
          return ok({
            access_token: "mock-token",
            refresh_token: "mock-refresh",
          });
        }
        if (method === "post" && url === "auth/signup") {
          return ok({
            id: "mock-user-id",
            email: payload?.email ?? "user@example.com",
          });
        }
        if (method === "get" && url === "auth/me") {
          return ok({
            id: "mock-user-id",
            email: "user@example.com",
            first_name: "Mock",
            last_name: "User",
          });
        }
        return ok({});
      };
      this.http = axios.create({
        headers: this.setupHeaders(),
        adapter,
      });
    } else {
      this.http = axios.create({
        baseURL: this.baseURL,
        withCredentials: false,
        headers: this.setupHeaders(),
      });
    }
  }

  // Get authorization token from cookies
  private get getAuthorization() {
    const accessToken = StorageService.getItem("access_token") || "";
    return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  }

  // Initialize service configuration
  public service() {
    this.injectRequestInterceptor();

    return this;
  }

  // Setup headers
  private setupHeaders(hasAttachment = false) {
    return {
      "Content-Type": hasAttachment
        ? "multipart/form-data"
        : "application/json",
      ...this.getAuthorization,
    };
  }

  // Handle HTTP requests
  private async request<T>(
    method: HttpMethod,
    url: string,
    options: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.http.request<T>({
        method,
        url,
        ...options,
      });

      return response.data;
    } catch (error) {
      return this.normalizeError(error);
    }
  }

  // Perform GET request
  public async get<T>(
    url: string,
    params?: IService.IParams,
    hasAttachment = false
  ): Promise<T> {
    return this.request<T>(HttpMethod.GET, url, {
      params,
      headers: this.setupHeaders(hasAttachment),
      signal: params?.signal,
    });
  }

  // Perform POST request
  public async post<T, P>(
    url: string,
    payload?: P,
    params?: IService.IParams,
    hasAttachment = false
  ): Promise<T> {
    return this.request<T>(HttpMethod.POST, url, {
      data: payload,
      params,
      headers: this.setupHeaders(hasAttachment),
      signal: params?.signal,
    });
  }

  // Perform PUT request
  public async put<T, P>(
    url: string,
    payload: P,
    params?: IService.IParams,
    hasAttachment = false
  ): Promise<T> {
    return this.request<T>(HttpMethod.PUT, url, {
      data: payload,
      params,
      headers: this.setupHeaders(hasAttachment),
      signal: params?.signal,
    });
  }

  // Perform DELETE request
  public async delete<T>(
    url: string,
    params?: IService.IParams,
    hasAttachment = false
  ): Promise<T> {
    return this.request<T>(HttpMethod.DELETE, url, {
      params,
      headers: this.setupHeaders(hasAttachment),
      signal: params?.signal,
    });
  }

  // Inject request interceptors for request and response
  private injectRequestInterceptor() {
    // Request interceptor
    this.http.interceptors.request.use(
      (config) => {
        // Perform an action before sending the request
        // TODO: implement an NProgress loader
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.http.interceptors.response.use(
      (response) => {
        // Do something with response data
        return response;
      },
      (error) => {
        // Implement a global error handler
        return Promise.reject(error);
      }
    );
  }

  // Normalize errors
  private normalizeError(error: any) {
    // Implement a global error handler
    return Promise.reject(error);
  }
}
