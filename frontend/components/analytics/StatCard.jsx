'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui'
import { ArrowUp, ArrowDown } from 'lucide-react'

export function StatCard({
  label,
  value,
  icon: Icon,
  trend = null,
  color = 'accent',
}) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const duration = 1000
    const increment = value / (duration / 16)
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setDisplayValue(value)
        clearInterval(timer)
      } else {
        setDisplayValue(Math.floor(current))
      }
    }, 16)

    return () => clearInterval(timer)
  }, [value])

  const bgColor = {
    accent: 'bg-accent/10',
    green: 'bg-green-100 dark:bg-green-900',
    blue: 'bg-blue-100 dark:bg-blue-900',
    red: 'bg-red-100 dark:bg-red-900',
    yellow: 'bg-yellow-100 dark:bg-yellow-900',
  }

  const textColor = {
    accent: 'text-accent',
    green: 'text-green-600 dark:text-green-400',
    blue: 'text-blue-600 dark:text-blue-400',
    red: 'text-red-600 dark:text-red-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
  }

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-text-muted text-sm mb-2">{label}</p>
          <motion.p
            className="text-3xl font-bold text-text-primary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {displayValue.toLocaleString()}
          </motion.p>
          {trend !== null && (
            <div className="flex items-center gap-1 mt-2">
              {trend >= 0 ? (
                <ArrowUp className="w-4 h-4 text-green-600" />
              ) : (
                <ArrowDown className="w-4 h-4 text-red-600" />
              )}
              <span
                className={`text-xs font-medium ${
                  trend >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {Math.abs(trend)}% from last month
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg ${bgColor[color]}`}>
            <Icon className={`w-6 h-6 ${textColor[color]}`} />
          </div>
        )}
      </div>
    </Card>
  )
}
