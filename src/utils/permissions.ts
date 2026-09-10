import { HouseRole, StudentProfile } from '../types';

// The owner passcode
export const OWNER_PASSCODE = 'hufflepuff';

// Positions authorized to edit, add, and delete Class Schedules, Calendar, and Announcements
export const MANAGEMENT_ROLES: HouseRole[] = [
  'เจ้าของเว็บ',
  'แอดมิน',
  'Badger วิชาการ',
  'Helper',
  'หัวหน้าบ้าน',
  'Badger Leader',
  'ศาสตราจารย์ประจำบ้าน',
  'Prefect',
];

/**
 * Check if the user is the Website Owner (เจ้าของเว็บ)
 * Only the Website Owner has the authority to grant or revoke the "Admin" role.
 */
export function isOwner(profile: StudentProfile | null | undefined): boolean {
  if (!profile) {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hufflepuff_owner_authenticated') === 'true';
    }
    return false;
  }
  if (profile.isOwner === true) return true;
  if (profile.houseRole === 'เจ้าของเว็บ') return true;
  if (profile.houseRoles && profile.houseRoles.includes('เจ้าของเว็บ')) return true;
  if (typeof window !== 'undefined' && localStorage.getItem('hufflepuff_owner_authenticated') === 'true') {
    return true;
  }
  return false;
}

/**
 * Check if the user has the authority to assign or remove the Admin role
 * STRICT REQUIREMENT: Only the Website Owner can assign Admin to others!
 */
export function canAssignAdminRole(profile: StudentProfile | null | undefined): boolean {
  return isOwner(profile);
}

/**
 * Check if the user specifically holds Admin or Owner role
 */
export function isAdmin(profile: StudentProfile | null | undefined): boolean {
  if (!profile) {
    return isOwner(profile);
  }
  if (isOwner(profile)) return true;
  if (profile.houseRole === 'แอดมิน') return true;
  if (profile.houseRoles && profile.houseRoles.includes('แอดมิน')) return true;
  return false;
}

/**
 * Check if the user has permission to add, edit, or delete house content (Admin or Management)
 */
export function canManageHouseContent(profile: StudentProfile | null | undefined): boolean {
  if (!profile) return isOwner(profile);
  
  // Owner and Admin always have full management permissions
  if (isAdmin(profile) || isOwner(profile)) return true;

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
