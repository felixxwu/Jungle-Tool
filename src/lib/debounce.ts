export const throttle = (func: () => void, delay: number) => {
  let lastTime = 0
  return () => {
    const now = Date.now()
    if (now - lastTime >= delay) {
      func()
      lastTime = now
    }
  }
}

export const debounce = <T extends any[]>(func: (...args: T) => void, delay: number) => {
  let timeout: number
  return (...args: T) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), delay)
  }
}

export const throttleAndDebounce = (func: () => void, delay: number) => {
  return throttle(debounce(func, delay), delay)
}
