import { AuthUser } from "@/store/authStore";
import { Role } from "@/store/dataStore";

/**
 * 사용자 권한 체크 유틸리티 함수들
 */

// 사용자의 권한 목록 가져오기
export function getUserPermissions(user: AuthUser | null, roles: Role[]): string[] {
  if (!user) return [];
  
  // 시스템관리자, 관리자는 모든 권한
  if (user.role === '시스템관리자' || user.role === '관리자' || user.role === 'admin') {
    return ['ALL'];
  }
  
  const userRole = roles.find(role => role.name === user.role);
  return userRole ? userRole.permissions : [];
}

// 편집 권한 체크
export function hasEditPermission(
  user: AuthUser | null, 
  roles: Role[], 
  permissionCode: string
): boolean {
  if (!user) return false;
  
  // 시스템관리자, 관리자는 모든 권한
  if (user.role === '시스템관리자' || user.role === '관리자' || user.role === 'admin') {
    return true;
  }
  
  const permissions = getUserPermissions(user, roles);
  return permissions.includes(`${permissionCode}_EDIT`) || permissions.includes('ALL');
}

// 조회 권한 체크
export function hasViewPermission(
  user: AuthUser | null, 
  roles: Role[], 
  permissionCode: string
): boolean {
  if (!user) return false;
  
  // 시스템관리자, 관리자는 모든 권한
  if (user.role === '시스템관리자' || user.role === '관리자' || user.role === 'admin') {
    return true;
  }
  
  const permissions = getUserPermissions(user, roles);
  return permissions.includes(`${permissionCode}_VIEW`) || 
         permissions.includes(`${permissionCode}_EDIT`) || 
         permissions.includes('ALL');
}

// 특정 권한 체크
export function hasPermission(
  user: AuthUser | null, 
  roles: Role[], 
  permission: string
): boolean {
  if (!user) return false;
  
  // 시스템관리자, 관리자는 모든 권한
  if (user.role === '시스템관리자' || user.role === '관리자' || user.role === 'admin') {
    return true;
  }
  
  const permissions = getUserPermissions(user, roles);
  return permissions.includes(permission) || permissions.includes('ALL');
}

