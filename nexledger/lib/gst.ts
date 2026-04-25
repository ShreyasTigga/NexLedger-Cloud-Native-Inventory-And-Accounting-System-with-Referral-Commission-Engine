const GST_STATE_MAP: Record<string, string> = {
  "01": "Jammu & Kashmir",
  "07": "Delhi",
  "09": "Uttar Pradesh",
  "19": "West Bengal",
  "27": "Maharashtra",
  "29": "Karnataka",
  "33": "Tamil Nadu"
}

export function getStateFromGSTIN(gstin?: string) {
  const code = gstin?.substring(0, 2)
  return code ? GST_STATE_MAP[code] || "Unknown" : null
}