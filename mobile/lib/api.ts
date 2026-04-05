import { getToken } from './storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    // Send the JWT as a cookie header so the existing Next.js middleware works
    headers['Cookie'] = `token=${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, body?.error ?? 'Request failed');
  }

  return res.json() as Promise<T>;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export type LoginResponse = {
  message: string;
  redirect: string | null;
  user: import('../types').User;
  token?: string; // included when we parse Set-Cookie
};

export async function login(
  email: string,
  password: string,
): Promise<{ token: string; user: import('../types').User }> {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Login failed' }));
    throw new ApiError(res.status, body?.error ?? 'Invalid credentials');
  }

  const data = await res.json() as LoginResponse;

  // Extract JWT from Set-Cookie header (React Native can read response headers)
  const setCookie = res.headers.get('set-cookie') ?? '';
  const tokenMatch = setCookie.match(/token=([^;]+)/);
  const token = tokenMatch?.[1] ?? '';

  if (!token) {
    throw new ApiError(401, 'No token received from server');
  }

  return { token, user: data.user };
}

export async function logout(): Promise<void> {
  await request('/api/auth/logout', { method: 'POST' }).catch(() => {});
}

export async function getProfile(): Promise<import('../types').User> {
  return request<import('../types').User>('/api/user/profile');
}

// ─── Projects ────────────────────────────────────────────────────────────────

export async function getProjects(): Promise<import('../types').Project[]> {
  return request<import('../types').Project[]>('/api/projects');
}

export async function getProject(id: string): Promise<import('../types').Project> {
  return request<import('../types').Project>(`/api/projects/${id}`);
}

// ─── RFIs ────────────────────────────────────────────────────────────────────

export async function getRFIs(projectId: string): Promise<import('../types').RFI[]> {
  return request<import('../types').RFI[]>(`/api/projects/${projectId}/rfis`);
}

export async function getRFI(projectId: string, rfiId: string): Promise<import('../types').RFI> {
  return request<import('../types').RFI>(`/api/projects/${projectId}/rfis/${rfiId}`);
}

export async function createRFI(
  projectId: string,
  data: Partial<import('../types').RFI>,
): Promise<import('../types').RFI> {
  return request<import('../types').RFI>(`/api/projects/${projectId}/rfis`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateRFI(
  projectId: string,
  rfiId: string,
  data: Partial<import('../types').RFI>,
): Promise<import('../types').RFI> {
  return request<import('../types').RFI>(`/api/projects/${projectId}/rfis/${rfiId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function addRFIResponse(
  projectId: string,
  rfiId: string,
  response: string,
): Promise<import('../types').RFIResponse> {
  return request<import('../types').RFIResponse>(
    `/api/projects/${projectId}/rfis/${rfiId}/responses`,
    {
      method: 'POST',
      body: JSON.stringify({ response }),
    },
  );
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export async function getTasks(projectId: string): Promise<import('../types').Task[]> {
  return request<import('../types').Task[]>(`/api/projects/${projectId}/tasks`);
}

export async function getTask(projectId: string, taskId: string): Promise<import('../types').Task> {
  return request<import('../types').Task>(`/api/projects/${projectId}/tasks/${taskId}`);
}

export async function createTask(
  projectId: string,
  data: Partial<import('../types').Task>,
): Promise<import('../types').Task> {
  return request<import('../types').Task>(`/api/projects/${projectId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTask(
  projectId: string,
  taskId: string,
  data: Partial<import('../types').Task>,
): Promise<import('../types').Task> {
  return request<import('../types').Task>(`/api/projects/${projectId}/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ─── Submittals ───────────────────────────────────────────────────────────────

export async function getSubmittals(projectId: string): Promise<import('../types').Submittal[]> {
  return request<import('../types').Submittal[]>(`/api/projects/${projectId}/submittals`);
}

export async function updateSubmittal(
  projectId: string,
  submittalId: string,
  data: Partial<import('../types').Submittal>,
): Promise<import('../types').Submittal> {
  return request<import('../types').Submittal>(
    `/api/projects/${projectId}/submittals/${submittalId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    },
  );
}

// ─── Daily Log ───────────────────────────────────────────────────────────────

export async function getDailyLogs(projectId: string): Promise<import('../types').DailyLog[]> {
  return request<import('../types').DailyLog[]>(`/api/projects/${projectId}/daily-log`);
}

export async function createDailyLog(
  projectId: string,
  data: Partial<import('../types').DailyLog>,
): Promise<import('../types').DailyLog> {
  return request<import('../types').DailyLog>(`/api/projects/${projectId}/daily-log`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateDailyLog(
  projectId: string,
  logId: string,
  data: Partial<import('../types').DailyLog>,
): Promise<import('../types').DailyLog> {
  return request<import('../types').DailyLog>(`/api/projects/${projectId}/daily-log/${logId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ─── Budget ──────────────────────────────────────────────────────────────────

export async function getBudget(projectId: string): Promise<import('../types').BudgetLineItem[]> {
  return request<import('../types').BudgetLineItem[]>(`/api/projects/${projectId}/budget`);
}

// ─── Photos ──────────────────────────────────────────────────────────────────

export async function getPhotoAlbums(projectId: string): Promise<import('../types').PhotoAlbum[]> {
  return request<import('../types').PhotoAlbum[]>(`/api/projects/${projectId}/photos/albums`);
}

export async function getPhotos(
  projectId: string,
  albumId?: string,
): Promise<import('../types').ProjectPhoto[]> {
  const qs = albumId ? `?album_id=${albumId}` : '';
  return request<import('../types').ProjectPhoto[]>(`/api/projects/${projectId}/photos${qs}`);
}

// ─── Directory ───────────────────────────────────────────────────────────────

export async function getDirectory(
  projectId: string,
): Promise<import('../types').DirectoryContact[]> {
  return request<import('../types').DirectoryContact[]>(`/api/projects/${projectId}/directory`);
}
