export type CompanyRole = "owner" | "admin" | "editor";

export function canManageTeam(role: CompanyRole | null | undefined): boolean {
  return role === "owner" || role === "admin";
}

export function canInviteRole(
  currentRole: CompanyRole | null | undefined,
  targetRole: "admin" | "editor",
): boolean {
  if (currentRole === "owner") return targetRole === "admin" || targetRole === "editor";
  if (currentRole === "admin") return targetRole === "editor";
  return false;
}

export function canEditCompany(role: CompanyRole | null | undefined): boolean {
  return role === "owner" || role === "admin";
}

export function invitableRoles(currentRole: CompanyRole | null | undefined): ("admin" | "editor")[] {
  if (currentRole === "owner") return ["admin", "editor"];
  if (currentRole === "admin") return ["editor"];
  return [];
}

export function roleLabel(role: CompanyRole | null | undefined): string {
  switch (role) {
    case "owner": return "Dono";
    case "admin": return "Admin";
    case "editor": return "Editor";
    default: return "—";
  }
}
