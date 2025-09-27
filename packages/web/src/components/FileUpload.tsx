import React, { useState, useRef } from 'react'
import { messagesAPI } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

interface FileUploadProps {
  onUploadSuccess: (message: any) => void
  receiverId?: string
  groupId?: string
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadSuccess, receiverId, groupId }) => {
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    await uploadFile(file)
  }

  const uploadFile = async (file: File) => {
    if (!user) return

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 10MB')
      return
    }

    setIsUploading(true)

    try {
      // Create form data
      const formData = new FormData()
      formData.append('file', file)
      formData.append('receiverId', receiverId || '')
      formData.append('groupId', groupId || '')

      // In a real implementation, you'd upload to a file server first
      // For now, we'll simulate with a placeholder URL
      const mockFileUrl = `https://example.com/files/${Date.now()}-${file.name}`

      const response = await messagesAPI.sendMessage({
        receiverId,
        groupId,
        content: `Shared file: ${file.name}`,
        type: file.type.startsWith('image/') ? 'image' :
              file.type.startsWith('video/') ? 'video' :
              file.type.startsWith('audio/') ? 'audio' : 'file',
        fileUrl: mockFileUrl,
        fileName: file.name,
        fileSize: file.size
      })

      onUploadSuccess(response.data)
      toast.success('File uploaded successfully')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload file')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div
      className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
        isDragging
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-300 hover:border-gray-400 dark:border-gray-600'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip"
      />

      <div className="space-y-2">
        <div className="text-4xl">
          {isUploading ? (
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          ) : (
            '📎'
          )}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {isUploading ? (
            'Uploading...'
          ) : (
            <>
              <p className="font-medium">Drop files here or click to browse</p>
              <p className="text-xs mt-1">Images, videos, audio, documents (max 10MB)</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default FileUpload
