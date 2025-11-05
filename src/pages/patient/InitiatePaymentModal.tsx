// new/src/components/patient/InitiatePaymentModal.tsx

import React, { useState } in "react"
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
import type{ ApiAppointment } from "@/types/api"
import * as patientService from "@/api/patientService"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/context/AuthContext"

interface Props {
  isOpen: boolean
  onClose: () => void
  appointment: ApiAppointment | null
}

export const InitiatePaymentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  appointment,
}) => {
  const { state } = useAuth()
  const [phoneNumber, setPhoneNumber] = useState(state.user?.phone || "")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!appointment) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phoneNumber) {
      setError("Please enter a valid phone number.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await patientService.initiatePayment({
        appointmentId: appointment.id,
        phoneNumber,
      })
      toast({
        title: "Payment Initiated",
        description:
          "Please check your phone and enter your PIN to confirm payment.",
      })
      // You could start polling for payment status here or use WebSockets
      console.log("Payment initiated, paymentId:", data.paymentId)
      onClose()
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError("This appointment has already been paid for.")
      } else if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else {
        setError("An error occurred. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Confirm Payment</DialogTitle>
          <DialogDescription>
            Pay for your appointment with Dr.{" "}
            {appointment.doctor.user.fullName}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="p-4 bg-blue-50 rounded-md border border-blue-200 text-center">
            <div className="text-sm text-blue-700">Total Amount Due</div>
            <div className="text-3xl font-bold text-blue-900">
              {appointment.doctor.consultationFee.toLocaleString("en-RW", {
                style: "currency",
                currency: "RWF",
              })}
            </div>
          </div>
          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">
              Phone
            </Label>
            <Input
              id="phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="col-span-3"
              placeholder="078..."
              disabled={isLoading}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Processing..." : "Pay Now"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}