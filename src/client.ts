import { loadApiKey } from "./auth"
import { loadConfig } from "./config"

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: string,
  ) {
    super(detail)
    this.name = "ApiError"
  }
}

export class MizzenClient {
  private readonly baseUrl: string
  private readonly timeout: number

  constructor(baseUrl?: string, timeout?: number) {
    const config = loadConfig()
    this.baseUrl = baseUrl ?? config.api.base_url
    this.timeout = (timeout ?? config.api.timeout) * 1000
  }

  private getHeaders(apiKey: string | null): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Client-Type": "cli",
    }

    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`
    }

    return headers
  }

  private buildUrl(path: string, params?: Record<string, string>): string {
    const base = this.baseUrl.endsWith("/") ? this.baseUrl.slice(0, -1) : this.baseUrl
    const cleanPath = path.startsWith("/") ? path : `/${path}`
    const url = new URL(`${base}${cleanPath}`)

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value)
      }
    }

    return url.toString()
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let detail = response.statusText

      try {
        const body = await response.json()
        if (typeof body === "object" && body !== null) {
          const errorBody = body as Record<string, unknown>
          // FastAPI validation errors
          if (Array.isArray(errorBody["detail"])) {
            const items = (errorBody["detail"] as unknown[])
              .map((d) => {
                if (typeof d === "object" && d !== null) {
                  const dd = d as Record<string, unknown>
                  const loc = Array.isArray(dd["loc"]) ? (dd["loc"] as unknown[]).join(".") : ""
                  const msg = typeof dd["msg"] === "string" ? dd["msg"] : JSON.stringify(d)
                  return loc ? `${loc}: ${msg}` : msg
                }
                return String(d)
              })
              .join("; ")
            if (items) detail = items
          } else if (typeof errorBody["detail"] === "string") {
            detail = errorBody["detail"]
          }
          // Our error format: { error: { code, message } }
          const err = errorBody["error"]
          if (typeof err === "object" && err !== null) {
            const ee = err as Record<string, unknown>
            const msg = typeof ee["message"] === "string" ? ee["message"] : undefined
            if (msg) detail = msg
          }
        }
      } catch {
        // Response body is not JSON
      }

      throw new ApiError(response.status, detail)
    }

    if (response.status === 204 || response.headers.get("content-length") === "0") {
      return {} as T
    }

    const text = await response.text()
    if (!text) return {} as T

    return JSON.parse(text) as T
  }

  private async request<T>(
    method: string,
    path: string,
    options: { params?: Record<string, string>; body?: unknown; timeoutMs?: number } = {}
  ): Promise<T> {
    const { params, body, timeoutMs } = options

    const apiKey = loadApiKey()
    if (!apiKey) {
      throw new ApiError(401, "No API key configured. Run: mizzen auth set-key <your-api-key>")
    }

    const url = this.buildUrl(path, params)
    const headers = this.getHeaders(apiKey)

    const effectiveTimeout = timeoutMs ?? this.timeout
    const fetchOptions: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(effectiveTimeout),
    }

    if (body !== undefined) {
      fetchOptions.body = JSON.stringify(body)
    }

    try {
      const response = await fetch(url, fetchOptions)
      return this.handleResponse<T>(response)
    } catch (error) {
      if (error instanceof ApiError) throw error

      if (error instanceof DOMException && error.name === "TimeoutError") {
        throw new ApiError(0, `Request timed out after ${effectiveTimeout / 1000}s`)
      }

      if (error instanceof TypeError) {
        throw new ApiError(0, `Network error: ${error.message}. Is the API server running?`)
      }

      throw new ApiError(0, `Unexpected error: ${String(error)}`)
    }
  }

  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>("GET", path, { params })
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, { body })
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PUT", path, { body })
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PATCH", path, { body })
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>("DELETE", path)
  }
}

let clientInstance: MizzenClient | null = null

export function getClient(): MizzenClient {
  if (!clientInstance) {
    clientInstance = new MizzenClient()
  }
  return clientInstance
}
