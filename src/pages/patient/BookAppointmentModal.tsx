// new/src/components/patient/BookAppointmentModal.tsx

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
import { ApiDoctor, ApiHospital } from "@/types/api"
import * as patientService from "@/api/patientService"
import { toast } from "@/hooks/use-toast"

interface Props {
  isOpen: boolean
  onClose: () => void
  onAppointmentBooked: () => void
}

export const BookAppointmentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onAppointmentBooked,
}) => {
  const { state } = useAuth()
  const [hospitals, setHospitals] = useState<ApiHospital[]>([])
  const [doctors, setDoctors] = useState<ApiDoctor[]>([])
  const [filteredDoctors, setFilteredDoctors] = useState<ApiDoctor[]>([])

  const [selectedHospital, setSelectedHospital] = useState("")
  const [selectedDoctor, setSelectedDoctor] = useState("")
  const [appointmentDate, setAppointmentDate] = useState("")
  const [appointmentType, setAppointmentType] = useState<
    "VIDEO" | "AUDIO" | "CHAT"
  >("VIDEO")

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch hospitals and doctors on modal open
  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          setIsLoading(true)
          const [hospitalsData, doctorsData] = await Promise.all([
            patientService.getHospitals(),
            patientService.getDoctors(),
          ])
          setHospitals(hospitalsData)
          setDoctors(doctorsData)
          setFilteredDoctors(doctorsData) // Show all doctors initially
          setError(null)
        } catch (err) {
          setError("Failed to load booking data. Please try again.")
        } finally {
          setIsLoading(false)
        }
      }
      fetchData()
    }
  }, [isOpen])

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
  }, [selectedHospital, doctors])

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
      await patientService.bookAppointment({
        doctorId: selectedDoctor,
        hospitalId: selectedHospital,
        appointmentDate: new Date(appointmentDate).toISOString(),
        type: appointmentType,
      })
      toast({
        title: "Appointment Booked!",
        description: "Your appointment request has been sent.",
      })
      onAppointmentBooked()
      onClose()
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else {
        setError("An error occurred while booking. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
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
              <SelectContent>
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
              <SelectContent>
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
              <SelectContent>
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
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Booking..." : "Book Appointment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}