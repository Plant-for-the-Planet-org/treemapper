'use client'

import React, { useRef } from 'react'
import { useBuilder } from '@/forms/FormBuilderContext'
import { FormField, FormSection } from '@/forms/types'
import { Star, Heart, ThumbsUp, Smartphone } from 'lucide-react'

function SignaturePreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)

  const start = (e: React.MouseEvent) => {
    drawing.current = true
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const r = canvas.getBoundingClientRect()
    ctx.beginPath()
    ctx.strokeStyle = '#374151'
    ctx.lineWidth = 1.5
    ctx.lineCap = 'round'
    ctx.moveTo(e.clientX - r.left, e.clientY - r.top)
  }

  const draw = (e: React.MouseEvent) => {
    if (!drawing.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const r = canvas.getBoundingClientRect()
    ctx.lineTo(e.clientX - r.left, e.clientY - r.top)
    ctx.stroke()
  }

  const stop = () => { drawing.current = false }

  const clear = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)
  }

  return (
    <div className="border border-gray-300 rounded-md overflow-hidden">
      <canvas
        ref={canvasRef}
        width={240}
        height={80}
        className="w-full cursor-crosshair bg-white block"
        onMouseDown={start}
        onMouseMove={draw}
        onMouseUp={stop}
        onMouseLeave={stop}
      />
      <button
        onClick={clear}
        className="w-full text-xs text-gray-400 hover:text-red-500 py-1 border-t border-gray-200 bg-gray-50 hover:bg-red-50 transition-colors"
      >
        Clear
      </button>
    </div>
  )
}

function RatingPreview({ maxRating, icon }: { maxRating: number; icon: string }) {
  const [hovered, setHovered] = React.useState(0)
  const [selected, setSelected] = React.useState(0)

  const RatingIcon = icon === 'heart' ? Heart : icon === 'thumbs' ? ThumbsUp : Star

  return (
    <div className="flex gap-1 flex-wrap">
      {Array.from({ length: maxRating }, (_, i) => i + 1).map(n => (
        <button
          key={n}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => setSelected(n === selected ? 0 : n)}
          className="focus:outline-none"
        >
          <RatingIcon
            className={`w-5 h-5 transition-colors ${n <= (hovered || selected) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
          />
        </button>
      ))}
    </div>
  )
}

function FieldPreview({ field }: { field: FormField }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1">
        <span className="text-xs font-medium text-gray-700">{field.label || 'Untitled'}</span>
        {field.required && <span className="text-red-500 text-xs">*</span>}
      </div>
      {field.helpText && <p className="text-xs text-gray-400">{field.helpText}</p>}

      {field.type === 'text' && !field.textConfig.multiline && (
        <input
          className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:border-green-400"
          placeholder={field.placeholder || 'Enter text...'}
          readOnly
        />
      )}

      {field.type === 'text' && field.textConfig.multiline && (
        <textarea
          className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:border-green-400 resize-none"
          placeholder={field.placeholder || 'Enter text...'}
          rows={field.textConfig.rows}
          readOnly
        />
      )}

      {field.type === 'number' && (
        <div className="flex items-center gap-1">
          <input
            type="number"
            className="flex-1 border border-gray-300 rounded-md px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:border-green-400"
            placeholder={field.placeholder || '0'}
            readOnly
          />
          {field.numberConfig.unit && (
            <span className="text-xs text-gray-500 bg-gray-100 border border-gray-300 rounded-md px-2 py-1.5">{field.numberConfig.unit}</span>
          )}
        </div>
      )}

      {field.type === 'date' && (
        <input
          type={field.dateConfig.includeTime ? 'datetime-local' : 'date'}
          className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:border-green-400"
          readOnly
        />
      )}

      {field.type === 'dropdown' && (
        <select className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:border-green-400">
          <option value="">{field.placeholder || 'Select an option...'}</option>
          {field.options.map(o => <option key={o.id} value={o.value}>{o.label}</option>)}
        </select>
      )}

      {field.type === 'radio' && (
        <div className="space-y-1.5">
          {field.options.map(o => (
            <label key={o.id} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name={field.id} className="accent-green-600" />
              <span className="text-xs text-gray-700">{o.label}</span>
            </label>
          ))}
        </div>
      )}

      {field.type === 'checkbox' && (
        <div className="space-y-1.5">
          {field.options.map(o => (
            <label key={o.id} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="accent-green-600 rounded" />
              <span className="text-xs text-gray-700">{o.label}</span>
            </label>
          ))}
        </div>
      )}

      {field.type === 'signature' && <SignaturePreview />}

      {field.type === 'slider' && (
        <div className="space-y-1">
          <input
            type="range"
            min={field.sliderConfig.min}
            max={field.sliderConfig.max}
            step={field.sliderConfig.step}
            defaultValue={field.sliderConfig.min}
            className="w-full accent-green-600"
          />
          {field.sliderConfig.showValue && (
            <div className="flex justify-between text-xs text-gray-400">
              <span>{field.sliderConfig.min}</span>
              <span>{field.sliderConfig.max}</span>
            </div>
          )}
        </div>
      )}

      {field.type === 'rating' && (
        <RatingPreview maxRating={field.ratingConfig.maxRating} icon={field.ratingConfig.icon} />
      )}
    </div>
  )
}

function SectionPreview({ section }: { section: FormSection }) {
  return (
    <div className="space-y-4">
      <div className="border-b border-gray-200 pb-2">
        <h3 className="text-sm font-semibold text-gray-800">{section.title}</h3>
        {section.description && <p className="text-xs text-gray-400 mt-0.5">{section.description}</p>}
      </div>
      {section.fields.map(field => (
        <FieldPreview key={field.id} field={field} />
      ))}
    </div>
  )
}

export default function MobilePreview() {
  const { state } = useBuilder()
  const { form } = state
  const totalFields = form.sections.reduce((a, s) => a + s.fields.length, 0)

  return (
    <div className="flex-shrink-0 border-l border-gray-200 bg-gray-50 flex flex-col overflow-hidden w-full h-full">
      <div className="p-3 border-b border-gray-200 flex items-center gap-2">
        <Smartphone className="w-4 h-4 text-gray-500" />
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mobile Preview</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex justify-center">
        {/* Phone frame */}
        <div className="w-full max-w-[260px]">
          <div className="border-4 border-gray-800 rounded-[32px] overflow-hidden shadow-xl bg-white">
            {/* Status bar */}
            <div className="bg-gray-800 px-4 py-1.5 flex justify-between items-center">
              <span className="text-white text-xs">9:41</span>
              <div className="flex gap-1">
                <div className="w-3 h-1.5 bg-white rounded-full" />
                <div className="w-3 h-1.5 bg-white rounded-full opacity-60" />
                <div className="w-3 h-1.5 bg-white rounded-full opacity-40" />
              </div>
            </div>

            {/* App header */}
            <div className="bg-green-600 px-4 py-3">
              <p className="text-white text-sm font-semibold truncate">{form.name}</p>
              <p className="text-green-100 text-xs">{totalFields} fields</p>
            </div>

            {/* Form content */}
            <div className="p-4 space-y-6 max-h-[480px] overflow-y-auto">
              {form.sections.length === 0 ? (
                <div className="text-center py-8 text-gray-300 text-xs">
                  Add sections and fields to preview
                </div>
              ) : (
                form.sections.map(section => (
                  <SectionPreview key={section.id} section={section} />
                ))
              )}
            </div>

            {/* Submit button */}
            {totalFields > 0 && (
              <div className="px-4 py-3 border-t border-gray-100">
                <button className="w-full bg-green-600 text-white text-sm font-medium py-2.5 rounded-xl">
                  Submit
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
