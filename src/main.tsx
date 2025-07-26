import { createRoot } from 'react-dom/client'
import App from './App.tsx'

declare global {
  interface Array<T> {
    insert(index: number, ...items: T[]): void
  }
}

Array.prototype.insert = function (index: number, ...items: any[]) {
  this.splice(index, 0, ...items)
}

createRoot(document.getElementById('root')!).render(<App />)
