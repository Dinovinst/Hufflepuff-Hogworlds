import { HouseRole, StudentProfile } from '../types';

// Positions authorized to edit, add, and delete Class Schedules, Calendar, and Announcements
export const MANAGEMENT_ROLES: HouseRole[] = [
  'แอดมิน',
  'Badger วิชาการ',
  'Helper',
  'หัวหน้าบ้าน',
  'Badger Leader',
  'ศาสตราจารย์ประจำบ้าน',
  'Prefect',
];

/**
 * Check if the user specifically holds the Admin (แอดมิน) role
 */
export function isAdmin(profile: StudentProfile | null | undefined): boolean {
  if (!profile) return false;
  if (profile.houseRole === 'แอดมิน') return true;
  if (profile.houseRoles && profile.houseRoles.includes('แอดมิน')) return true;
  return false;
}

/**
 * Check if the user has permission to add, edit, or delete house content (Admin or Management)
 */
export function canManageHouseContent(profile: StudentProfile | null | undefined): boolean {
  if (!profile) return false;
  
  // Admin always has full permissions
  if (isAdmin(profile)) return true;

  // Check multiple roles if present
  if (profile.houseRoles && profile.houseRoles.length > 0) {
    return profile.houseRoles.some(role => MANAGEMENT_ROLES.includes(role));
  }
  
  // Check primary role
  if (profile.houseRole && MANAGEMENT_ROLES.includes(profile.houseRole)) {
    return true;
  }

  return false;
}
