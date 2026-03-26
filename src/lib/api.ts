/**
 * api.ts — frontend client for the Skill Navigator backend (port 3001)
 * Falls back to localStorage if the server is not running.
 */

const BASE = 'http://localhost:3001/api';

async function req<T>(
  method: string, path: string, body?: unknown
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data as T;
}

// ─── Health check ─────────────────────────────────────────────────────────────
export async function isServerAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/employees`, { method: 'GET' });
    return res.ok;
  } catch { return false; }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface RegisterPayload {
  name: string; email: string; phone: string;
  designation: string; department: string; location: string;
  yearsIT: number; yearsZensar: number;
  password: string; resumeUploaded: boolean; zensarId: string;
}

export interface EmployeeRecord {
  id: string; name: string; email: string; phone: string;
  designation: string; department: string; location: string;
  yearsIT: number; yearsZensar: number;
  primarySkill: string; primaryDomain: string;
  overallCapability: number;
  submitted: string; submittedAt: string;
  resumeUploaded: string; createdAt: string;
}

export async function apiRegister(payload: RegisterPayload): Promise<EmployeeRecord> {
  const res = await req<{ success: boolean; employee: EmployeeRecord }>('POST', '/register', payload);
  return res.employee;
}

export async function apiLogin(login: string, password: string): Promise<EmployeeRecord> {
  const res = await req<{ success: boolean; employee: EmployeeRecord }>('POST', '/login', { login, password });
  return res.employee;
}

// ─── Employees ────────────────────────────────────────────────────────────────
export async function apiGetAllEmployees(): Promise<EmployeeRecord[]> {
  return req<EmployeeRecord[]>('GET', '/employees');
}

export async function apiGetEmployee(id: string): Promise<EmployeeRecord> {
  return req<EmployeeRecord>('GET', `/employees/${id}`);
}

export async function apiUpdateEmployee(id: string, data: Partial<EmployeeRecord>): Promise<EmployeeRecord> {
  const res = await req<{ success: boolean; employee: EmployeeRecord }>('PUT', `/employees/${id}`, data);
  return res.employee;
}

// ─── Skills ───────────────────────────────────────────────────────────────────
export interface ApiSkillRating {
  skillId: string; selfRating: number; managerRating: number | null; validated: boolean;
}

export async function apiGetSkills(employeeId: string): Promise<ApiSkillRating[]> {
  return req<ApiSkillRating[]>('GET', `/employees/${employeeId}/skills`);
}

export async function apiSaveSkills(employeeId: string, skills: ApiSkillRating[]): Promise<void> {
  await req('PUT', `/employees/${employeeId}/skills`, { skills });
}

export async function apiSubmit(employeeId: string): Promise<void> {
  await req('POST', `/employees/${employeeId}/submit`, {});
}
