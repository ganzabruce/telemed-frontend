import { LayoutDashboard, Building2, Users, UserPlus, UserCog, DollarSign, Calendar, ClipboardList, Sparkles, UserCircle, Shield, MessageSquare, Clock } from 'lucide-react';

type NavigationItem = {
  name: string;
  href: string;
  icon: any;
};

export const navigationByRole: Record<string, NavigationItem[]> = {
  ADMIN: [
    { name: "Dashboard", href: "/admin-dashboard", icon: LayoutDashboard },
    { name: "Hospitals", href: "/admin/hospitals", icon: Building2 },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Invite Admin", href: "/admin/invite-admin", icon: UserPlus },
    { name: "Services", href: "/admin/services", icon: Sparkles },
    { name: "Team", href: "/admin/team", icon: UserCircle },
    { name: "Insurance", href: "/admin/insurance", icon: Shield },
  ],
  HOSPITAL_ADMIN: [
    { name: "Dashboard", href: "/hospital-admin-dashboard", icon: LayoutDashboard },
    { name: "Staff", href: "/hospital-admin/staff", icon: UserCog },
    { name: "Patients", href: "/hospital-admin/patients", icon: Users },
    { name: "Payments", href: "/hospital-admin/payments", icon: DollarSign },
  ],
  DOCTOR: [
    { name: "Dashboard", href: "/doctor-dashboard", icon: LayoutDashboard },
    { name: "Appointments", href: "/doctor/appointments", icon: Calendar },
    { name: "Consultations", href: "/doctor/consultations", icon: MessageSquare },
    { name: "Patients", href: "/doctor/patients", icon: Users },
    { name: "Availability", href: "/doctor/availability", icon: Clock },
  ],
  PATIENT: [
    { name: "Dashboard", href: "/patient-dashboard", icon: LayoutDashboard },
    { name: "Browse Hospitals", href: "/patient/browse-hospitals", icon: Building2 },
    { name: "My Appointments", href: "/patient/appointments", icon: Calendar },
    { name: "Consultations", href: "/patient/consultations", icon: MessageSquare },
    { name: "Records", href: "/patient/records", icon: ClipboardList },
  ],
};
