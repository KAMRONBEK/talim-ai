/**
 * Path-constant builders for the Talim API.
 *
 * Discoverability aid: a single place to find the REST paths each resource
 * uses. Hooks under `@/hooks/*` may reference these, but are not required to —
 * the existing inline string literals remain valid.
 *
 * Note: this lives alongside `@/lib/api` (the axios client). Import the axios
 * instance from `@/lib/api` and the path builders from `@/lib/api/endpoints`.
 */

export const authEndpoints = {
  login: () => '/auth/login',
  register: () => '/auth/register',
  me: () => '/auth/me',
  password: () => '/auth/me/password',
  tutorRequest: () => '/auth/tutor-request',
  upgradeToTenant: () => '/auth/upgrade-to-tenant',
} as const;

export const tenantEndpoints = {
  root: () => '/tenant',
  content: () => '/tenant/content',
  contentItem: (id: string) => `/tenant/content/${id}`,
  students: () => '/tenant/students',
  student: (id: string) => `/tenant/students/${id}`,
  studentProgress: (id: string) => `/tenant/students/${id}/progress`,
  progress: () => '/tenant/progress',
  assessments: () => '/tenant/assessments',
  assessment: (id: string) => `/tenant/assessments/${id}`,
  assignments: () => '/tenant/assignments',
  questionBanks: () => '/tenant/question-banks',
  joinCodeRegenerate: () => '/tenant/join-code/regenerate',
  billing: () => '/billing/me',
} as const;

export const learnerEndpoints = {
  assessments: () => '/learner/assessments',
  summary: () => '/learner/summary',
} as const;

export const contentEndpoints = {
  /** Base path depends on role: tenant owners use `/tenant/content`. */
  base: (isTenantOwner = false) => (isTenantOwner ? '/tenant/content' : '/content'),
  item: (id: string, isTenantOwner = false) =>
    `${isTenantOwner ? '/tenant/content' : '/content'}/${id}`,
  retry: (id: string, isTenantOwner = false) =>
    `${isTenantOwner ? '/tenant/content' : '/content'}/${id}/retry`,
  upload: () => '/content/upload',
  youtube: () => '/content/youtube',
  progress: (contentId: string) => `/content/${contentId}/progress`,
  learningHistory: (contentId: string) => `/content/${contentId}/learning-history`,
  transcript: (contentId: string) => `/content/${contentId}/transcript`,
  video: (contentId: string) => `/content/${contentId}/video`,
  slides: (contentId: string, isTenantOwner = false) =>
    `${isTenantOwner ? '/tenant/content' : '/content'}/${contentId}/slides`,
  file: (contentId: string, isTenantOwner = false) =>
    `${isTenantOwner ? '/tenant/content' : '/content'}/${contentId}/file`,
  reparse: (contentId: string, isTenantOwner = false) =>
    `${isTenantOwner ? '/tenant/content' : '/content'}/${contentId}/reparse`,
} as const;

export const assessmentEndpoints = {
  quiz: (id: string) => `/quiz/${id}`,
  quizSubmit: (id: string) => `/quiz/${id}/submit`,
  quizLatestAttempt: (id: string) => `/quiz/${id}/attempts/latest`,
  quizForContent: (contentId: string) => `/quiz/content/${contentId}`,
  summary: (contentId: string) => `/summary/${contentId}`,
} as const;

export const endpoints = {
  auth: authEndpoints,
  tenant: tenantEndpoints,
  learner: learnerEndpoints,
  content: contentEndpoints,
  assessments: assessmentEndpoints,
} as const;
