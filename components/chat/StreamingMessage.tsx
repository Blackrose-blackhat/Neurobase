// components/chat/StreamingMessage.tsx
"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

interface StreamingMessageProps {
  content: string
}

export function StreamingMessage({ content }: StreamingMessageProps) {
  const [displayedContent, setDisplayedContent] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (currentIndex < content.length) {
      const timeout = setTimeout(() => {
        setDisplayedContent((prev) => prev + content[currentIndex])
        setCurrentIndex((prev) => prev + 1)
      }, 30)

      return () => clearTimeout(timeout)
    }
  }, [currentIndex, content])

  return (
    <div className="text-sm leading-relaxed">
      {displayedContent}
      {currentIndex < content.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="inline-block w-2 h-4 bg-current ml-0.5"
        />
      )}
    </div>
  )
}