const API_BASE = '/api';

interface RequestOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

async function request<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let body = options.body;
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method || 'GET',
    headers,
    body,
  });

  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('登录已过期');
  }

  // Check if response is a file download
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('spreadsheet') || contentType.includes('zip')) {
    if (!res.ok) throw new Error('下载失败');
    const blob = await res.blob();
    return blob as any;
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || '请求失败');
  }

  return data;
}

export const api = {
  get: <T = any>(path: string) => request<T>(path),
  post: <T = any>(path: string, body?: any) => request<T>(path, { method: 'POST', body }),
  put: <T = any>(path: string, body?: any) => request<T>(path, { method: 'PUT', body }),
  delete: <T = any>(path: string, body?: any) => request<T>(path, { method: 'DELETE', body }),
  upload: <T = any>(path: string, file: File | FormData, fieldName = 'file') => {
    let formData: FormData;
    if (file instanceof FormData) {
      formData = file;
    } else {
      formData = new FormData();
      formData.append(fieldName, file);
    }
    return request<T>(path, { method: 'POST', body: formData });
  },
  download: async (path: string, filename: string, body?: any) => {
    const method = body ? 'POST' : 'GET';
    const blob = await request<Blob>(path, { method, body });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },
};
