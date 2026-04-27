export async function apiFetch(
  url: string,
  options: RequestInit = {}
) {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    credentials: "include" 
  })

  // 🔐 HANDLE UNAUTHORIZED
  if (res.status === 401) {
    // Redirect to login (session expired / not logged in)
    window.location.href = "/auth/login"
    return null
  }

  let data = null

  try {
    data = await res.json()
  } catch {
    throw new Error("Invalid server response")
  }

  if (!res.ok) {
    throw new Error(data?.error || "Request failed")
  }

  return data?.data ?? data
}