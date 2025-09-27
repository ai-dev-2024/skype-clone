import React from 'react'

const LoadingSpinner = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        <p className="text-white text-lg">Loading...</p>
      </div>
    </div>
  )
}

export default LoadingSpinner
