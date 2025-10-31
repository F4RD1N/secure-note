import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// This function merges multiple CSS class names together.
// It uses 'clsx' to handle conditional classes and 'tailwind-merge'
// to intelligently merge Tailwind CSS classes without conflicts.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
