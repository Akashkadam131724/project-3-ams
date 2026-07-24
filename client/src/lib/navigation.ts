export type NavItem = {
  href: string;
  label: string;
  superAdminOnly?: boolean;
};

export const mainNav: NavItem[] = [
  { href: "/projects", label: "Projects" },
];

export const adminNav: NavItem[] = [
  { href: "/admin/create-user", label: "Create user", superAdminOnly: true },
  { href: "/admin/create-project", label: "Create project", superAdminOnly: true },
  { href: "/admin/assign-owner", label: "Assign owner", superAdminOnly: true },
  { href: "/admin/users", label: "Users", superAdminOnly: true },
];
