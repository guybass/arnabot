import { User } from '@/api/entities';

/**
 * Apply ownership filter for regular users, allowing admins to see all items
 * @param {Object} filterCriteria - Basic filter criteria
 * @returns {Object} - Updated filter criteria with ownership check if needed
 */
export async function applyOwnershipFilter(filterCriteria = {}) {
  try {
    // Get current user
    const currentUser = await User.me();
    
    // If user is admin, no filter needed - return original criteria
    if (currentUser?.role === 'admin') {
      return filterCriteria;
    }
    
    // For regular users, add created_by filter
    return {
      ...filterCriteria,
      created_by: currentUser?.email
    };
  } catch (error) {
    console.error("Error applying ownership filter:", error);
    // If there's an error getting user, default to showing nothing for security
    return { ...filterCriteria, created_by: 'no-access' };
  }
}

/**
 * Filter a list of items based on user role and ownership
 * @param {Array} items - Array of items to filter
 * @returns {Array} - Filtered array
 */
export async function filterByOwnership(items = []) {
  try {
    const currentUser = await User.me();
    
    // Admin sees all items
    if (currentUser?.role === 'admin') {
      return items;
    }
    
    // Regular users only see their own items
    return items.filter(item => item.created_by === currentUser?.email);
  } catch (error) {
    console.error("Error filtering by ownership:", error);
    return []; // Return empty array if error
  }
}