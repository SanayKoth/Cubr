type Brand = {
  brand: string
}

function userAgentBrands(): readonly Brand[] | null {
  const data = (
    navigator as Navigator & { userAgentData?: { brands?: readonly Brand[] } }
  ).userAgentData
  return data?.brands ?? null
}

export function isChromeBrowser(): boolean {
  const brands = userAgentBrands()
  if (brands?.some((entry) => entry.brand === 'Google Chrome')) {
    return !brands.some((entry) => entry.brand.includes('Edge'))
  }

  const ua = navigator.userAgent
  return (
    (ua.includes('Chrome') || ua.includes('CriOS')) &&
    !ua.includes('Edg') &&
    !ua.includes('OPR') &&
    !ua.includes('Opera') &&
    !ua.includes('Electron')
  )
}

export function ganTimerSupported(): boolean {
  return isChromeBrowser() && 'bluetooth' in navigator
}
