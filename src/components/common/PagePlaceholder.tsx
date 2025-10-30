// src/components/common/PagePlaceholder.tsx
import React from "react"

interface Props {
  title: string
  description?: string
}

const PagePlaceholder: React.FC<Props> = ({ title, description }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <h1 className="text-3xl font-bold text-blue-600 mb-2">{title}</h1>
      <p className="text-gray-500 text-lg">{description || "This page is under development."}</p>
    </div>
  )
}

export default PagePlaceholder
