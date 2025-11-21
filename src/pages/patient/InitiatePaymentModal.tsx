// new/src/components/patient/InitiatePaymentModal.tsx

import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { ApiAppointment } from "@/types/api"
import { initiatePayment } from "@/api/patientsApi"
import { toast } from "react-hot-toast"

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
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!appointment) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsLoading(true)
    setError(null)

    try {
      const data = await initiatePayment({
        appointmentId: appointment.id,
      })
      toast.success("Payment initiated! Please check your phone and enter your PIN to confirm payment.")
      // You could start polling for payment status here or use WebSockets
      console.log("Payment initiated, paymentId:", data.paymentId)
      onClose()
    } catch (err: any) {
      console.error("Payment initiation error:", err)
      console.error("Full error details:", {
        message: err.message,
        response: err.response,
        request: err.request,
        config: err.config,
      })
      
      // Handle specific error cases
      if (err.response?.status === 404) {
        // Check if it's a Paypack error
        const errorMessage = err.response?.data?.message || ""
        if (errorMessage.includes("agent not found") || errorMessage.includes("Payment Provider Error")) {
          const errorMsg = "Payment service is not configured. Please check Paypack credentials in the backend environment variables."
          setError(errorMsg)
          toast.error(errorMsg)
        } else {
          // Route not found - likely backend not deployed with latest code
          const errorMsg = "Payment endpoint not found. The backend may need to be updated. Please contact support."
          setError(errorMsg)
          toast.error(errorMsg)
        }
      } else if (err.response?.status === 409) {
        const errorMsg = "This appointment has already been paid for."
        setError(errorMsg)
        toast.error(errorMsg)
      } else if (err.response?.status === 400) {
        // Bad request - could be missing phone number or invalid data
        const errorMsg = err.response?.data?.message || "Invalid request. Please check your profile has a phone number set."
        setError(errorMsg)
        toast.error(errorMsg)
      } else if (err.response?.status === 503) {
        // Service unavailable - hospital payment phone not configured
        const errorMsg = err.response?.data?.message || "Payment service is not available. Please contact the hospital."
        setError(errorMsg)
        toast.error(errorMsg)
      } else if (err.response?.data?.message) {
        setError(err.response.data.message)
        toast.error(err.response.data.message)
      } else if (err.message) {
        // Network errors or other axios errors
        const errorMsg = err.message.includes('Network Error') 
          ? "Network error. Please check your connection and try again."
          : err.message
        setError(errorMsg)
        toast.error(errorMsg)
      } else {
        const errorMsg = "An error occurred. Please try again."
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