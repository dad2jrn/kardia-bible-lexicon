import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convert a category display name to a URL-safe lowercase ID.
 * Migrated verbatim from tools/kardia-generator-v2.html catToId().
 */
export function catToId(cat: string): string {
  return cat
    .toLowerCase()
    .replace(/\s*\/\s*/g, '-')
    .replace(/\s+/g, '-')
    .replace(/['\u2018\u2019]/g, '')
}

/**
 * Escape HTML special characters for safe innerHTML insertion.
 * Migrated verbatim from tools/kardia-generator-v2.html escapeHTML().
 */
export function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
