import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // For special admin operations, add multiple headers to support various authentication methods
  // This is specifically for the deployed environment where cookies might not work
  const headers: Record<string, string> = {};
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  // Check if the admin token exists in localStorage
  let adminToken = null;
  try {
    adminToken = localStorage.getItem('admin_token_dvd70ply');
  } catch (err) {
    console.log('Error reading localStorage:', err);
  }
  
  // For all admin operations related to activities, include various auth headers
  if (url.includes("/api/activities")) {
    // Only add auth headers for operations that modify data (not for GET requests)
    if (method === "DELETE" || method === "POST" || method === "PATCH" || method === "PUT") {
      // Add multiple authentication methods for redundancy
      headers["Authorization"] = "Bearer Admin-dvd70ply";
      headers["X-Admin-Key"] = "dvd70ply";
      
      // If admin token exists in localStorage, add it as a header
      if (adminToken === 'Administrator-dvd70ply') {
        headers["X-Admin-Auth-Token"] = "Administrator-dvd70ply";
      }
      
      // For DELETE methods, we'll also try appending the token to the URL if all else fails
      if (method === "DELETE" && !url.includes("?")) {
        url = `${url}?adminToken=Administrator-dvd70ply`;
      }
    }
  }
  
  // Also add auth headers for importing activities
  if (url.includes("/api/activities/import")) {
    headers["Authorization"] = "Bearer Admin-dvd70ply";
    headers["X-Admin-Key"] = "dvd70ply";
    
    // If admin token exists in localStorage, add it as a header
    if (adminToken === 'Administrator-dvd70ply') {
      headers["X-Admin-Auth-Token"] = "Administrator-dvd70ply";
    }
  }
  
  const res = await fetch(url, {
    method,
    headers: headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
