export async function apiFetch(
  url: string,
  options: RequestInit = {}
) {
  try {
    const res = await fetch(url, {
      ...options,
      credentials: "include", // ✅ always send cookies
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    })

    let data = null

    try {
      data = await res.json()
    } catch {
      throw new Error("Invalid server response")
    }

    if (!res.ok) {
      if (res.status === 401) {
        window.location.href = "/retailer/login"
        return null
      }

      throw new Error(data?.error || "Request failed")
    }

    return data?.data ?? data

  } catch (err: any) {
    console.error("API ERROR:", err)
    alert(err.message || "Something went wrong")
    return null
  }
}