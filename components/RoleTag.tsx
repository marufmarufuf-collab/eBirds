export default function RoleTag({ role }: { role: string }) {
  const label = role === "super_admin" ? "Super Admin" : role === "user" ? "User" : role;
  return <span className={`tag ${role === "super_admin" ? "tag-admin" : ""}`}>{label}</span>;
}
