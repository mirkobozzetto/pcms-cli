import { readFileSync } from 'node:fs'
import { basename, extname } from 'node:path'
import type {
  PayloadLoginResponse,
  PayloadMeResponse,
  PayloadDocument,
  PayloadPaginatedResponse,
  PayloadCreateResponse,
  PayloadUpdateResponse,
  PayloadDeleteResponse,
  PayloadCountResponse,
  PayloadUploadResponse,
  PayloadVersionDocument,
  PayloadAccessResponse,
  FindParams,
  FindByIDParams,
  MutationParams,
  UploadParams,
  VersionParams,
} from '../types/api.js'

export class PayloadAPI {
  private readonly baseUrl: string
  private token: string | undefined

  constructor(domain: string, token?: string) {
    this.baseUrl = domain.replace(/\/$/, '')
    this.token = token
  }

  getToken(): string {
    if (this.token === undefined) throw new Error('Not authenticated')
    return this.token
  }

  getDomain(): string {
    return this.baseUrl
  }

  private authHeaders(): Record<string, string> {
    if (this.token) {
      return { Authorization: `JWT ${this.token}` }
    }
    return {}
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`
    const headers: Record<string, string> = {
      ...this.authHeaders(),
      ...(options.headers as Record<string, string> | undefined),
    }

    const res = await fetch(url, { ...options, headers })

    if (!res.ok) {
      const body = await res.text()
      throw new Error(`HTTP ${res.status}: ${body}`)
    }

    return res.json() as Promise<T>
  }

  private buildQuery(params: Record<string, string | number | undefined>): string {
    const entries = Object.entries(params).filter(
      (entry): entry is [string, string | number] => entry[1] !== undefined,
    )
    if (entries.length === 0) return ''
    const qs = entries
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&')
    return `?${qs}`
  }

  async login(email: string, password: string): Promise<PayloadLoginResponse> {
    const res = await this.request<PayloadLoginResponse>('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    this.token = res.token
    return res
  }

  async me(): Promise<PayloadMeResponse> {
    return this.request<PayloadMeResponse>('/api/users/me')
  }

  async logout(): Promise<void> {
    await this.request<Record<string, string>>('/api/users/logout', { method: 'POST' })
    this.token = undefined
  }

  async refreshToken(): Promise<PayloadLoginResponse> {
    const res = await this.request<PayloadLoginResponse>('/api/users/refresh-token', {
      method: 'POST',
    })
    this.token = res.token
    return res
  }

  async find(collection: string, params?: FindParams): Promise<PayloadPaginatedResponse> {
    const query = params
      ? this.buildQuery(params as Record<string, string | number | undefined>)
      : ''
    return this.request<PayloadPaginatedResponse>(`/api/${collection}${query}`)
  }

  async findByID(
    collection: string,
    id: string | number,
    params?: FindByIDParams,
  ): Promise<PayloadDocument> {
    const query = params
      ? this.buildQuery(params as Record<string, string | number | undefined>)
      : ''
    return this.request<PayloadDocument>(`/api/${collection}/${id}${query}`)
  }

  async create(
    collection: string,
    data: Record<string, unknown>,
    params?: MutationParams,
  ): Promise<PayloadCreateResponse> {
    const query = params
      ? this.buildQuery(params as Record<string, string | number | undefined>)
      : ''
    return this.request<PayloadCreateResponse>(`/api/${collection}${query}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  }

  async update(
    collection: string,
    id: string | number,
    data: Record<string, unknown>,
    params?: MutationParams,
  ): Promise<PayloadUpdateResponse> {
    const query = params
      ? this.buildQuery(params as Record<string, string | number | undefined>)
      : ''
    return this.request<PayloadUpdateResponse>(`/api/${collection}/${id}${query}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  }

  async deleteDoc(collection: string, id: string | number): Promise<PayloadDeleteResponse> {
    return this.request<PayloadDeleteResponse>(`/api/${collection}/${id}`, {
      method: 'DELETE',
    })
  }

  async count(collection: string, params?: { where?: string }): Promise<PayloadCountResponse> {
    const query = params?.where ? `?where=${encodeURIComponent(params.where)}` : ''
    return this.request<PayloadCountResponse>(`/api/${collection}/count${query}`)
  }

  async upload(filePath: string, params?: UploadParams): Promise<PayloadUploadResponse> {
    const fileBuffer = readFileSync(filePath)
    const filename = basename(filePath)
    const mimeType = mimeFromExt(extname(filename))

    const boundary = `----FormBoundary${Date.now().toString(16)}`
    const parts: Buffer[] = []

    const addField = (name: string, value: string): void => {
      parts.push(
        Buffer.from(
          `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`,
        ),
      )
    }

    if (params?.alt) addField('alt', params.alt)
    if (params?.locale) addField('locale', params.locale)

    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`,
      ),
    )
    parts.push(fileBuffer)
    parts.push(Buffer.from(`\r\n--${boundary}--\r\n`))

    const body = Buffer.concat(parts)

    return this.request<PayloadUploadResponse>('/api/media', {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': String(body.length),
      },
      body,
    })
  }

  async getGlobal(slug: string, params?: FindByIDParams): Promise<PayloadDocument> {
    const query = params
      ? this.buildQuery(params as Record<string, string | number | undefined>)
      : ''
    return this.request<PayloadDocument>(`/api/globals/${slug}${query}`)
  }

  async updateGlobal(
    slug: string,
    data: Record<string, unknown>,
    params?: MutationParams,
  ): Promise<PayloadUpdateResponse> {
    const query = params
      ? this.buildQuery(params as Record<string, string | number | undefined>)
      : ''
    return this.request<PayloadUpdateResponse>(`/api/globals/${slug}${query}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  }

  async findVersions(
    collection: string,
    id: string | number,
    params?: VersionParams,
  ): Promise<PayloadPaginatedResponse<PayloadVersionDocument>> {
    const query = params
      ? this.buildQuery(params as Record<string, string | number | undefined>)
      : ''
    return this.request<PayloadPaginatedResponse<PayloadVersionDocument>>(
      `/api/${collection}/${id}/versions${query}`,
    )
  }

  async getVersion(
    collection: string,
    versionId: string,
    params?: { depth?: number },
  ): Promise<PayloadVersionDocument> {
    const query = params
      ? this.buildQuery(params as Record<string, string | number | undefined>)
      : ''
    return this.request<PayloadVersionDocument>(`/api/${collection}/versions/${versionId}${query}`)
  }

  async restoreVersion(collection: string, versionId: string): Promise<PayloadDocument> {
    return this.request<PayloadDocument>(`/api/${collection}/versions/${versionId}`, {
      method: 'POST',
    })
  }

  async findGlobalVersions(
    slug: string,
    params?: VersionParams,
  ): Promise<PayloadPaginatedResponse<PayloadVersionDocument>> {
    const query = params
      ? this.buildQuery(params as Record<string, string | number | undefined>)
      : ''
    return this.request<PayloadPaginatedResponse<PayloadVersionDocument>>(
      `/api/globals/${slug}/versions${query}`,
    )
  }

  async restoreGlobalVersion(slug: string, versionId: string): Promise<PayloadDocument> {
    return this.request<PayloadDocument>(`/api/globals/${slug}/versions/${versionId}`, {
      method: 'POST',
    })
  }

  async getAccess(): Promise<PayloadAccessResponse> {
    return this.request<PayloadAccessResponse>('/api/access')
  }

  async search(
    query: string,
    params?: { limit?: number; page?: number },
  ): Promise<PayloadPaginatedResponse> {
    const qs = this.buildQuery({
      q: query,
      ...(params as Record<string, string | number | undefined> | undefined),
    })
    return this.request<PayloadPaginatedResponse>(`/api/search${qs}`)
  }

  buildWhereParams(whereStr: string): Record<string, string> {
    return { where: whereStr }
  }
}

function mimeFromExt(ext: string): string {
  const map: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
  }
  return map[ext.toLowerCase()] ?? 'application/octet-stream'
}
