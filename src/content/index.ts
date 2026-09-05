import type { Module } from '../lib/types'
import { m1 } from './m1'

export const MODULES: Module[] = [m1]

export function allModules(): Module[] {
  return MODULES
}

export function getModule(id: string): Module | undefined {
  return MODULES.find(m => m.id === id)
}
