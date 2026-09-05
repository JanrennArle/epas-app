import type { Module } from '../lib/types'
import { m1 } from './m1'
import { m2 } from './m2'

export const MODULES: Module[] = [m1, m2]

export function allModules(): Module[] {
  return MODULES
}

export function getModule(id: string): Module | undefined {
  return MODULES.find(m => m.id === id)
}
