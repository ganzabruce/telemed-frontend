// new/src/pages/patient/Records.tsx

import React, { useState, useEffect } from "react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { AlertCircle, FileText, Loader2, Pill } from "lucide-react"
import type{ ApiAppointment } from "@/types/api"

import * as patientService from "../../api/patientsApi"
import { format } from "date-fns"
import { toast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

export default function Records() {
  const [records, setRecords] = useState<ApiAppointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setIsLoading(true)
        setError(null)
        // Fetch only completed appointments, as these are "records"
        // We are assuming the backend is modified to include
        // consultation data when fetching appointments.
        const data = await patientService.getAppointments("COMPLETED")
        setRecords(data.filter((app) => app.consultation)) // Only show if consultation exists
      } catch (err) {
        setError("Failed to fetch medical records. Please try again.")
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch medical records.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecords()
  }, [])

  return (
    <>
      <Toaster />
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-gray-800">
            My Medical Records
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            A secure list of all your past consultations and prescriptions.
          </p>
        </header>

        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        )}

        {!isLoading && !error && (
          <>
            {records.length > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                {records.map((record) => (
                  <AccordionItem key={record.id} value={record.id}>
                    <AccordionTrigger className="hover:bg-gray-50 px-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between w-full">
                        <span className="font-medium text-blue-700">
                          {format(new Date(record.appointmentDate), "PPP")}
                        </span>
                        <span className="text-sm text-gray-600 md:text-right">
                          with Dr. {record.doctor.user.fullName}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-6 bg-white border-t">
                      <div className="space-y-6">
                        <div>
                          <h4 className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            Doctor's Notes
                          </h4>
                          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {record.consultation?.doctorNotes ||
                              "No notes provided."}
                          </p>
                        </div>
                        {record.consultation?.prescription && (
                          <div>
                            <h4 className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-2">
                              <Pill className="w-5 h-5 text-green-600" />
                              Prescription
                            </h4>
                            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                              {record.consultation.prescription}
                            </p>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border border-dashed">
                <FileText className="w-12 h-12 text-gray-400" />
                <p className="mt-4 text-lg font-medium text-gray-600">
                  No medical records found
                </p>
                <p className="text-gray-500">
                  Your completed consultation records will appear here.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}