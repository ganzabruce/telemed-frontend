import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/context/AuthContext"
import type { ApiDoctor, ApiHospital, ApiAppointment } from "@/types/api"

import { bookAppointment, getDoctors, getHospitals } from "@/api/patientsApi"
import { toast } from "react-hot-toast"
import { InitiatePaymentModal } from "./InitiatePaymentModal"

interface Props {
  isOpen: boolean
  onClose: () => void
  onAppointmentBooked: () => void
  preselectedDoctorId?: string
  preselectedHospitalId?: string
}

export const BookAppointmentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onAppointmentBooked,
  preselectedDoctorId,
  preselectedHospitalId,
}) => {
  const { state } = useAuth()
  const [hospitals, setHospitals] = useState<ApiHospital[]>([])
  const [doctors, setDoctors] = useState<ApiDoctor[]>([])
  const [filteredDoctors, setFilteredDoctors] = useState<ApiDoctor[]>([])

  const [selectedHospital, setSelectedHospital] = useState(preselectedHospitalId || "")
  const [selectedDoctor, setSelectedDoctor] = useState(preselectedDoctorId || "")
  const [appointmentDate, setAppointmentDate] = useState("")
  const [appointmentType, setAppointmentType] = useState<
    "VIDEO" | "AUDIO" | "CHAT"
  >("VIDEO")

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bookedAppointment, setBookedAppointment] = useState<ApiAppointment | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedDoctorData, setSelectedDoctorData] = useState<ApiDoctor | null>(null)

  // Fetch hospitals and doctors on modal open
  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          setIsLoading(true)
          const [hospitalsData, doctorsData] = await Promise.all([
            getHospitals(),
            getDoctors(undefined, undefined, true), // Include availability
          ])
          setHospitals(hospitalsData)
          setDoctors(doctorsData)
          
          // If preselected values are provided, set them
          if (preselectedHospitalId) {
            setSelectedHospital(preselectedHospitalId)
            setFilteredDoctors(doctorsData.filter((doc) => doc.hospitalId === preselectedHospitalId))
          } else {
            setFilteredDoctors(doctorsData)
          }
          
          if (preselectedDoctorId) {
            setSelectedDoctor(preselectedDoctorId)
            const doctor = doctorsData.find((doc) => doc.id === preselectedDoctorId)
            if (doctor) {
              setSelectedDoctorData(doctor)
            }
          }
          
          setError(null)
        } catch (err) {
          setError("Failed to load booking data. Please try again.")
        } finally {
          setIsLoading(false)
        }
      }
      fetchData()
    } else {
      // Reset form when modal closes
      setSelectedHospital(preselectedHospitalId || "")
      setSelectedDoctor(preselectedDoctorId || "")
      setAppointmentDate("")
      setAppointmentType("VIDEO")
      setError(null)
      setBookedAppointment(null)
      setShowPaymentModal(false)
      setSelectedDoctorData(null)
    }
  }, [isOpen, preselectedDoctorId, preselectedHospitalId])

  // Filter doctors when hospital changes
  useEffect(() => {
    if (selectedHospital) {
      setFilteredDoctors(
        doctors.filter((doc) => doc.hospitalId === selectedHospital),
      )
    } else {
      setFilteredDoctors(doctors)
    }
    setSelectedDoctor("") // Reset doctor selection
    setSelectedDoctorData(null)
  }, [selectedHospital, doctors])

  // Update selected doctor data when doctor selection changes
  useEffect(() => {
    if (selectedDoctor) {
      const doctor = doctors.find((doc) => doc.id === selectedDoctor)
      setSelectedDoctorData(doctor || null)
    } else {
      setSelectedDoctorData(null)
    }
  }, [selectedDoctor, doctors])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if user is a patient
    if (state.user?.role !== 'PATIENT') {
      setError("Only patients can book appointments.")
      return
    }
    
    if (!selectedDoctor || !selectedHospital || !appointmentDate) {
      setError("Please fill out all fields.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Backend automatically finds patient profile from user ID, so we don't need to send patientId
      const appointment = await bookAppointment({
        doctorId: selectedDoctor,
        hospitalId: selectedHospital,
        appointmentDate: new Date(appointmentDate).toISOString(),
        type: appointmentType,
      })
      
      toast.success("Appointment booked successfully!")
      setBookedAppointment(appointment)
      
      // Show payment modal if doctor has consultation fee
      if (selectedDoctorData && selectedDoctorData.consultationFee > 0) {
        setShowPaymentModal(true)
      } else {
        onAppointmentBooked()
        onClose()
      }
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message)
        toast.error(err.response.data.message)
      } else {
        const errorMsg = "An error occurred while booking. Please try again."
        setError(errorMsg)
        toast.error(errorMsg)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle>Book a New Appointment</DialogTitle>
          <DialogDescription>
            Fill in the details to schedule your consultation.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="hospital" className="text-right">
              Hospital
            </Label>
            <Select
              value={selectedHospital}
              onValueChange={setSelectedHospital}
              disabled={isLoading}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a hospital" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {hospitals.map((hospital) => (
                  <SelectItem key={hospital.id} value={hospital.id}>
                    {hospital.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="doctor" className="text-right">
              Doctor
            </Label>
            <Select
              value={selectedDoctor}
              onValueChange={setSelectedDoctor}
              disabled={isLoading || !selectedHospital}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a doctor" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {filteredDoctors.length > 0 ? (
                  filteredDoctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {doctor.user.fullName} ({doctor.specialization})
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-gray-500">
                    No doctors available for this hospital.
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">
              Type
            </Label>
            <Select
              value={appointmentType}
              onValueChange={(val) =>
                setAppointmentType(val as "VIDEO" | "AUDIO" | "CHAT")
              }
              disabled={isLoading}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="VIDEO">Video Call</SelectItem>
                <SelectItem value="AUDIO">Audio Call</SelectItem>
                <SelectItem value="CHAT">Chat</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              Date & Time
            </Label>
            <Input
              id="date"
              type="datetime-local"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              className="col-span-3"
              disabled={isLoading}
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>
          {selectedDoctorData && selectedDoctorData.consultationFee > 0 && (
            <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
              <div className="text-sm text-blue-700 font-medium">
                Consultation Fee: {selectedDoctorData.consultationFee.toLocaleString("en-RW", {
                  style: "currency",
                  currency: "RWF",
                })}
              </div>
              <div className="text-xs text-blue-600 mt-1">
                Payment will be requested after booking
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-gray-500 hover:bg-gray-600 text-white">
              {isLoading ? "Booking..." : "Book Appointment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      
      {/* Payment Modal */}
      {bookedAppointment && (
        <InitiatePaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false)
            onAppointmentBooked()
            onClose()
          }}
          appointment={bookedAppointment}
        />
      )}
    </Dialog>
  )
}