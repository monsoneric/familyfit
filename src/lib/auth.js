const MEMBER_KEY = 'familyfit_member'

export function getActiveMember() {
  try {
    const raw = localStorage.getItem(MEMBER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setActiveMember(member) {
  localStorage.setItem(MEMBER_KEY, JSON.stringify(member))
}

export function clearActiveMember() {
  localStorage.removeItem(MEMBER_KEY)
}

export async function hashPasscode(passcode) {
  const encoder = new TextEncoder()
  const data    = encoder.encode(passcode.trim())
  const hashBuf = await crypto.subtle.digest('SHA-256', data)
  const hashArr = Array.from(new Uint8Array(hashBuf))
  return hashArr.map(b => b.toString(16).padStart(2, '0')).join('')
}
