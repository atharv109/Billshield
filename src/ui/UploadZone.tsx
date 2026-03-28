import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'

export function UploadZone() {
  const simulateUpload = useAppStore((s) => s.simulateUpload)
  const [dragOver, setDragOver] = useState(false)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        simulateUpload(acceptedFiles)
      }
      setDragOver(false)
    },
    [simulateUpload]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDragEnter: () => setDragOver(true),
    onDragLeave: () => setDragOver(false),
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png'],
    },
    multiple: true,
  })

  const active = isDragActive || dragOver

  return (
    <motion.div
      {...(getRootProps() as any)}
      animate={{
        scale: active ? 1.03 : 1,
        boxShadow: active
          ? '0 0 30px rgba(74, 158, 255, 0.4)'
          : '0 0 0px rgba(74, 158, 255, 0)',
      }}
      transition={{ duration: 0.2 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 24px',
        borderRadius: '8px',
        cursor: 'pointer',
        background: active
          ? 'rgba(74, 158, 255, 0.2)'
          : 'rgba(74, 158, 255, 0.12)',
        border: `1px solid ${active ? 'rgba(74, 158, 255, 0.7)' : 'rgba(74, 158, 255, 0.4)'}`,
        color: '#e0eaff',
        fontSize: '14px',
        fontWeight: 500,
        letterSpacing: '0.02em',
        userSelect: 'none',
        outline: 'none',
        transition: 'background 0.2s, border-color 0.2s',
      }}
    >
      <input {...getInputProps()} />
      <span style={{ fontSize: '18px' }}>↑</span>
      <span>{active ? 'Drop files here' : 'Upload Bill'}</span>
    </motion.div>
  )
}
