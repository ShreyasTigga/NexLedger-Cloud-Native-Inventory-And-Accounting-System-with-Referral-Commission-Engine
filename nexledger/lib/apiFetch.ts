let isRefreshing = false
let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken() {
  try {
    const refreshToken = localStorage.getItem("refreshToken")

    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${refreshToken}`
      }
    })

    if (!res.ok) return null

    const data = await res.json()

    localStorage.setItem("accessToken", data.accessToken)
    localStorage.setItem("refreshToken", data.refreshToken)

    return data.accessToken
  } catch {
    return null
  }
}

export async function apiFetch(
  url: string,
  options: RequestInit = {}
) {
  let accessToken = localStorage.getItem("accessToken")

  const makeRequest = async (token: string | null) => {
    return fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        Authorization: token ? `Bearer ${token}` : ""
      }
    })
  }

  let res = await makeRequest(accessToken)

  // 🔥 HANDLE 401 (TOKEN EXPIRED)
  if (res.status === 401) {

    if (!isRefreshing) {
      isRefreshing = true

      refreshPromise = refreshAccessToken().finally(() => {
        isRefreshing = false
      })
    }

    const newToken = await refreshPromise

    if (!newToken) {
      // ❌ Refresh failed → logout
      localStorage.clear()
      window.location.href = "/login"
      return null
    }

    // 🔁 Retry request
    res = await makeRequest(newToken)
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