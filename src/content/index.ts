import type { Module } from '../lib/types'
import { m1 } from './m1'
import { m2 } from './m2'
import { m3 } from './m3'
import { m4 } from './m4'

export const MODULES: Module[] = [m1, m2, m3, m4]

export function allModules(): Module[] {
  return MODULES
}

export function getModule(id: string): Module | undefined {
  return MODULES.find(m => m.id === id)
}
