// new/src/types/api.ts

// Basic user info included in nested responses
export interface ApiUser {
  fullName: string
  avatarUrl?: string
}

// Availability slot
export interface ApiAvailabilitySlot {
  id: string
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'
  startTime: string
  endTime: string
  isActive: boolean
}

// Doctor details
export interface ApiDoctor {
  id: string
  specialization: string
  consultationFee: number
  user: ApiUser & {
    id?: string
    email?: string
    phone?: string
  }
  hospitalId: string
  hospital?: {
    id: string
    name: string
  }
  availabilitySlots?: ApiAvailabilitySlot[]
  status?: string
}

// Hospital details
export interface ApiHospital {
  id: string
  name: string
  address?: string
  contactEmail?: string
  contactPhone?: string
  licenseNumber?: string
  doctors?: ApiDoctor[]
  admin?: {
    fullName: string
  }
}

// Consultation details (for Medical Records)
export interface ApiConsultation {
  id: string
  doctorNotes: string
  prescription: string
}

// Appointment details
export interface ApiAppointment {
  id: string
  appointmentDate: string // ISO string
  type: "VIDEO" | "AUDIO" | "CHAT"
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED"
  patient: { user: ApiUser; id: string }
  doctor: ApiDoctor
  hospital: ApiHospital
  // This is a crucial assumption for the Medical Records page
  consultation?: ApiConsultation
}

// Data required for booking an appointment
// Note: patientId is optional - backend automatically finds it from user ID for PATIENT role
export interface BookAppointmentData {
  patientId?: string // Optional - backend handles this for PATIENT role
  doctorId: string
  hospitalId: string
  appointmentDate: string // ISO string
  type: "VIDEO" | "AUDIO" | "CHAT"
}

// Data required for initiating a payment
export interface InitiatePaymentData {
  appointmentId: string
}