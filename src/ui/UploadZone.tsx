import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'

export function UploadZone() {
  const simulateUpload = useAppStore((s) => s.simulateUpload)
  const [dragOver, setDragOver] = useState(false)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) simulateUpload(acceptedFiles)
      setDragOver(false)
    },
    [simulateUpload]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDragEnter: () => setDragOver(true),
    onDragLeave: () => setDragOver(false),
    accept: { 'application/pdf': ['.pdf'], 'image/*': ['.jpg', '.jpeg', '.png'] },
    multiple: true,
  })

  const active = isDragActive || dragOver

  return (
    <motion.div
      {...(getRootProps() as any)}
      animate={{
        borderColor: active ? '#3a7fff' : '#1a2a45',
        boxShadow: active ? '0 0 24px rgba(58,127,255,0.2)' : '0 0 0px transparent',
      }}
      transition={{ duration: 0.2 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '11px 22px',
        borderRadius: '9px',
        cursor: 'pointer',
        background: active ? 'rgba(58, 127, 255, 0.1)' : '#08101a',
        border: `1px solid ${active ? '#3a7fff' : '#1a2a45'}`,
        color: active ? '#3a7fff' : '#c8d8f0',
        fontSize: '13px',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 500,
        letterSpacing: '0.01em',
        userSelect: 'none',
        outline: 'none',
        transition: 'color 0.2s, background 0.2s',
      }}
    >
      <input {...getInputProps()} />
      <span style={{ fontSize: '14px' }}>↑</span>
      <span>{active ? 'Drop files' : 'Upload Bill'}</span>
    </motion.div>
  )
}
