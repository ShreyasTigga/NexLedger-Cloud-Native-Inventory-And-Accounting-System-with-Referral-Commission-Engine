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
  if (typeof window !== "undefined") {
    window.location.href = "/retailer-auth/login"
  }
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