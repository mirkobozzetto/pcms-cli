/**
 * Payload CMS REST API response types.
 * @see https://payloadcms.com/docs/rest-api/overview
 */

export interface PayloadLoginResponse {
  readonly token: string
  readonly exp: number
  readonly user: PayloadUser
}

export interface PayloadUser {
  readonly id: number | string
  readonly email: string
  readonly roles?: readonly string[]
  readonly createdAt: string
  readonly updatedAt: string
  readonly [key: string]: unknown
}

export interface PayloadMeResponse {
  readonly user: PayloadUser | null
  readonly collection: string
  readonly token: string
}

export interface PayloadDocument {
  readonly id: number | string
  readonly createdAt: string
  readonly updatedAt: string
  readonly [key: string]: unknown
}

export interface PayloadPaginatedResponse<T = PayloadDocument> {
  readonly docs: readonly T[]
  readonly totalDocs: number
  readonly limit: number
  readonly totalPages: number
  readonly page: number
  readonly pagingCounter: number
  readonly hasPrevPage: boolean
  readonly hasNextPage: boolean
  readonly prevPage: number | null
  readonly nextPage: number | null
}

export interface PayloadCreateResponse<T = PayloadDocument> {
  readonly message: string
  readonly doc: T
}

export interface PayloadUpdateResponse<T = PayloadDocument> {
  readonly message: string
  readonly doc: T
}

export interface PayloadDeleteResponse<T = PayloadDocument> {
  readonly message: string
  readonly doc: T
}

export interface PayloadCountResponse {
  readonly totalDocs: number
}

export interface PayloadUploadResponse {
  readonly message: string
  readonly doc: PayloadMediaDocument
}

export interface PayloadMediaDocument extends PayloadDocument {
  readonly filename: string
  readonly mimeType: string
  readonly filesize: number
  readonly width?: number
  readonly height?: number
  readonly url: string
  readonly alt?: string
}

export interface PayloadVersionDocument {
  readonly id: string
  readonly parent: number | string
  readonly version: PayloadDocument
  readonly createdAt: string
  readonly updatedAt: string
}

export interface PayloadAccessResponse {
  readonly collections: Readonly<Record<string, PayloadCollectionAccess>>
  readonly globals: Readonly<Record<string, PayloadGlobalAccess>>
}

export interface PayloadCollectionAccess {
  readonly create: PayloadAccessPermission
  readonly read: PayloadAccessPermission
  readonly update: PayloadAccessPermission
  readonly delete: PayloadAccessPermission
}

export interface PayloadGlobalAccess {
  readonly read: PayloadAccessPermission
  readonly update: PayloadAccessPermission
}

export interface PayloadAccessPermission {
  readonly permission: boolean
}

export interface PayloadErrorResponse {
  readonly errors: readonly PayloadError[]
}

export interface PayloadError {
  readonly message: string
  readonly name?: string
  readonly data?: unknown
}

// ── Query params ──

export interface FindParams {
  readonly where?: string | undefined
  readonly sort?: string | undefined
  readonly limit?: number | undefined
  readonly page?: number | undefined
  readonly depth?: number | undefined
  readonly locale?: string | undefined
}

export interface FindByIDParams {
  readonly depth?: number | undefined
  readonly locale?: string | undefined
}

export interface MutationParams {
  readonly locale?: string | undefined
  readonly depth?: number | undefined
}

export interface UploadParams {
  readonly alt?: string | undefined
  readonly locale?: string | undefined
}

export interface VersionParams {
  readonly limit?: number | undefined
  readonly page?: number | undefined
  readonly depth?: number | undefined
}

// ── Where clause operators ──

export type WhereOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'greater_than_equal'
  | 'less_than'
  | 'less_than_equal'
  | 'like'
  | 'contains'
  | 'in'
  | 'not_in'
  | 'exists'

export const OPERATOR_MAP: Readonly<Record<string, WhereOperator>> = {
  '=': 'equals',
  '!=': 'not_equals',
  '>': 'greater_than',
  '>=': 'greater_than_equal',
  '<': 'less_than',
  '<=': 'less_than_equal',
  '~': 'like',
  in: 'in',
  nin: 'not_in',
  exists: 'exists',
} as const
