export const navigationByRole = {
  ADMIN: [
    { name: "Dashboard", href: "/admin-dashboard", icon: LayoutDashboard },
    { name: "Hospitals", href: "/admin/hospitals", icon: Building2 },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Invite Admin", href: "/admin/invite-admin", icon: UserPlus },
  ],
  HOSPITAL_ADMIN: [
    { name: "Dashboard", href: "/hospital-admin-dashboard", icon: LayoutDashboard },
    { name: "Staff", href: "/hospital-admin/staff", icon: UserCog },
    { name: "Patients", href: "/hospital-admin/patients", icon: Users },
  ],
  DOCTOR: [
    { name: "Dashboard", href: "/doctor-dashboard", icon: LayoutDashboard },
    { name: "Appointments", href: "/doctor/appointments", icon: Calendar },
    { name: "Patients", href: "/doctor/patients", icon: Users },
  ],
  RECEPTIONIST: [
    { name: "Dashboard", href: "/receptionist-dashboard", icon: LayoutDashboard },
    { name: "Appointments", href: "/receptionist/appointments", icon: Calendar },
    { name: "Patients", href: "/receptionist/patients", icon: Users },
  ],
  PATIENT: [
    { name: "Dashboard", href: "/patient-dashboard", icon: LayoutDashboard },
    { name: "My Appointments", href: "/patient/appointments", icon: Calendar },
    { name: "Records", href: "/patient/records", icon: ClipboardList },
  ],
};
