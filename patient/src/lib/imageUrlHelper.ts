/**
 * Image URL Utilities
 * Constructs proper image URLs for display
 */

import { environment } from '@/config/environment';

/**
 * Get full image URL for display
 * If URL is relative (/uploads/...), prepends API base URL
 * If URL is already absolute (http:/https:), returns as-is
 * @param imageUrl - Relative or absolute image URL
 * @returns Full image URL
 */
export const getImageUrl = (imageUrl: string | null | undefined): string => {
  if (!imageUrl) return '';
  
  // If it's already a full URL, return as-is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // If it's a relative URL, prepend the API base URL
  if (imageUrl.startsWith('/')) {
    const apiUrl = environment.getApiUrl();
    // Remove trailing slash from apiUrl if present
    const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    return `${baseUrl}${imageUrl}`;
  }
  
  // If it's a relative path without leading slash, prepend /uploads/
  return `${environment.getApiUrl()}/uploads/${imageUrl}`;
};

export default {
  getImageUrl
};
