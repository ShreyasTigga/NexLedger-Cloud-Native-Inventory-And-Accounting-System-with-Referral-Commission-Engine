export async function apiFetch(url: string, options: any = {}) {
  let res = await fetch(url, {
    credentials: "include",
    ...options
  })

  // 🔁 Try refresh if access token expired
  if (res.status === 401) {
    const refreshRes = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include"
    })

    if (refreshRes.ok) {
      // Retry original request
      res = await fetch(url, {
        credentials: "include",
        ...options
      })
    }
  }

  // ❌ Still failed → logout
  if (!res.ok) {
    window.location.href = "/retailer/login"
    return null
  }

  return res.json()
}