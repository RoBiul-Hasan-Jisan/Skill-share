'use client'

import { useState, useRef, useEffect } from 'react'
import { Modal, Button } from '@/components/ui'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

export function ProfilePhotoModal({ isOpen, onClose, onSave }) {
  const fileInputRef = useRef(null)
  const canvasRef = useRef(null)
  const [image, setImage] = useState(null)
  const [scale, setScale] = useState(1)
  const [loading, setLoading] = useState(false)

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5 MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setImage(event.target?.result)
      setScale(1)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!image || !canvasRef.current) return

    try {
      setLoading(true)
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')

      const img = new Image()
      img.onload = () => {
        const size = Math.min(img.width, img.height)
        const x = (img.width - size) / 2
        const y = (img.height - size) / 2

        canvas.width = 300
        canvas.height = 300
        ctx?.drawImage(img, x * scale, y * scale, size / scale, size / scale, 0, 0, 300, 300)

        const base64 = canvas.toDataURL('image/jpeg', 0.9)
        onSave(base64)
        toast.success('Profile photo updated successfully')
        setImage(null)
        setScale(1)
        onClose()
      }
      img.src = image
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save profile photo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold tracking-tight text-text-primary mb-2">
            Upload photo.
          </h2>
          <p className="text-sm text-text-secondary">
            Crop and adjust your profile picture. Click save when ready.
          </p>
        </div>

        {!image ? (
          /* Upload Area */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-8 cursor-pointer hover:border-accent hover:bg-surface-2 transition-all text-center"
            >
              <p className="text-text-primary font-semibold tracking-tight text-lg mb-2">
                Click or drag a photo here
              </p>
              <p className="text-xs text-text-muted uppercase tracking-wider">
                JPG · PNG · WEBP / MAX 5 MB
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </motion.div>
        ) : (
          /* Preview and Adjust */
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div>
              <label className="text-xs font-semibold text-accent uppercase tracking-wider mb-3 block">
                01 PREVIEW
              </label>
              <div className="w-full aspect-square rounded-lg bg-surface border border-border overflow-hidden">
                <img
                  src={image}
                  alt="Preview"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: `scale(${scale})`,
                    transformOrigin: 'center',
                  }}
                />
              </div>
            </div>

            {/* Scale Adjustment */}
            <div>
              <label className="text-xs font-semibold text-accent uppercase tracking-wider mb-3 block">
                02 ZOOM · {(scale * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-accent"
              />
              <p className="text-xs text-text-muted mt-2">Drag to zoom in or out</p>
            </div>

            {/* Hidden Canvas for Cropping */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Actions */}
            <div className="flex gap-3 mt-8 pt-6 border-t border-border">
              <Button
                variant="ghost"
                onClick={() => {
                  setImage(null)
                  setScale(1)
                }}
                className="flex-1"
              >
                CANCEL
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'SAVING...' : 'SAVE PHOTO →'}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </Modal>
  )
}
