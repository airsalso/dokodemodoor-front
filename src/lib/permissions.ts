export type Role = "ADMIN" | "SECURITY" | "USER";

export interface FeaturePermission {
  view: boolean;
  execute: boolean;
  manage: boolean;
}

export const ROLE_PERMISSIONS: Record<Role, Record<string, FeaturePermission>> = {
  ADMIN: {
    dashboard: { view: true, execute: true, manage: true },
    about: { view: true, execute: true, manage: true },
    pentest: { view: true, execute: true, manage: true },
    settings: { view: true, execute: true, manage: true },
    management: { view: true, execute: true, manage: true },
  },
  SECURITY: {
    dashboard: { view: true, execute: true, manage: true },
    about: { view: true, execute: true, manage: true },
    pentest: { view: true, execute: true, manage: true },
    settings: { view: true, execute: true, manage: true },
    management: { view: true, execute: false, manage: false },
  },
  USER: {
    dashboard: { view: true, execute: false, manage: false },
    about: { view: true, execute: false, manage: false },
    pentest: { view: true, execute: false, manage: false },
    settings: { view: true, execute: true, manage: false },
    management: { view: false, execute: false, manage: false },
  },
};

export const hasPermission = (userRole: Role, feature: string, action: keyof FeaturePermission): boolean => {
  const role = userRole || "USER";
  const permissions = ROLE_PERMISSIONS[role as Role];
  if (!permissions) return false;

  const featurePerm = permissions[feature];
  if (!featurePerm) return false;

  return featurePerm[action];
};
