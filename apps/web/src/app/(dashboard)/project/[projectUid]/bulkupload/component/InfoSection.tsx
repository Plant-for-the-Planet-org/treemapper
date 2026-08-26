'use client'

import React, { useState, useRef } from 'react'
import { Upload, Download, FileText, CheckCircle, AlertCircle, X, Layers, ArrowRight, ChevronRight } from 'lucide-react'
import { readTable, isSpreadsheetFile, isLegacyExcelFile, SPREADSHEET_ACCEPT } from '@/utils/spreadsheet'
import { downloadTreeMapperTemplate } from '@/utils/bulktemplate'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

const STEPS = [
  { label: 'Download the template', body: 'Download the template provided. It follows the format required for bulk data uploads.' },
  { label: 'Prepare your data', body: 'Open the template in Excel or Google Sheets and replace the sample rows with your data. Keep the column headers unchanged.' },
  { label: 'Import the file', body: 'Upload the file as .xlsx or .csv. Both work, so there is no need to convert it first.' },
  { label: 'Validate and edit', body: "We'll automatically validate the required fields. On the next screen, you'll have a chance to review and edit any data that needs correction." },
  { label: 'Species data', body: 'We only support species that exist in our database of over 60,000 entries. Please search using the scientific name. If you can\'t find a species, mark it as "Unknown". You can also request the addition of new species.' },
  { label: 'Final upload', body: 'Once everything looks good, click "Upload Data" to complete the process.' },
]

const InfoSection = ({ setFileData, updateStep, selectedProject, selectedSite }: any) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { projectUid } = useParams<{ projectUid: string }>()

  const handleCustomFormatClick = () => {
    const params = new URLSearchParams({
      projectId: selectedProject?.id ?? '',
      projectName: selectedProject?.name ?? '',
      siteId: selectedSite?.id ?? '',
      siteName: selectedSite?.name ?? '',
    })
    router.push(`/project/${projectUid}/bulkupload/custom-format?${params.toString()}`)
  }

  const validateFile = (file: File | undefined) => {
    if (!file) { setError('Please select a file'); return false }
    if (isLegacyExcelFile(file)) {
      setError('The old .xls format is not supported. Save the file as .xlsx or .csv and try again.')
      return false
    }
    if (!isSpreadsheetFile(file)) {
      setError('Please upload an Excel (.xlsx) or CSV file.')
      return false
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
    }
    return true
  }

  const handleConversion = async () => {
    setLoading(true)
    try {
      if (!fileInputRef?.current?.files?.[0]) throw new Error('No file selected')
      const file = fileInputRef.current.files[0]
      // dayFirst because the downloadable template and the validator on the
      // next screen both use DD/MM/YYYY. Excel date cells are rendered to match,
      // so a sheet and a CSV of the same data produce identical rows.
      const { rows } = await readTable(file, {
        dateFormat: 'dayFirst',
        transformHeader: (header) => header.trim(),
        transformValue: (value, header) => (header === 'TYPE' ? value.toLowerCase() : value),
      })
      if (rows.length === 0) throw new Error('That file has no data rows')
      setFileData(rows)
      updateStep(2)
    } catch (err: any) {
      setError('Error occurred while transforming data: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (file: File | undefined) => {
    setError('')
    if (file && validateFile(file)) setSelectedFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false)
    handleFileSelect(e.dataTransfer.files[0])
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  const removeFile = () => {
    setSelectedFile(null)
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Instructions */}
      <div className="space-y-4">
        <Card className="py-0 gap-0">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-5">
              <FileText size={14} className="text-primary" />
              <h2 className="text-base font-semibold text-foreground">How to bulk upload data</h2>
            </div>

            <ol className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              {STEPS.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">
                    {i + 1}
                  </span>
                  <div>
                    <span className="font-semibold text-foreground">{s.label}.</span> {s.body}
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Button variant="outline" onClick={downloadTreeMapperTemplate}>
          <Download size={14} className="mr-1.5" />
          Download template
        </Button>
      </div>

      {/* Right: Upload */}
      <div className="space-y-4">
        <Card className="py-0 gap-0">
          <CardContent className="p-5">
            <h3 className="text-base font-semibold text-foreground mb-4">Upload your Excel or CSV file</h3>

            <div
              className={cn(
                'relative border-2 border-dashed rounded-lg p-6 text-center transition-colors',
                dragActive || selectedFile ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/60',
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={SPREADSHEET_ACCEPT}
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              {selectedFile ? (
                <div className="space-y-1.5">
                  <CheckCircle size={28} className="mx-auto text-primary" />
                  <div className="flex items-center justify-center gap-2">
                    <FileText size={14} className="text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{selectedFile.name}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFile() }}
                      className="p-1 hover:bg-muted rounded-full transition-colors"
                    >
                      <X size={12} className="text-muted-foreground" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Upload size={28} className="mx-auto text-muted-foreground" />
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium text-primary hover:text-primary/80 cursor-pointer">Click to upload</span>{' '}
                    or drag and drop
                  </div>
                  <p className="text-xs text-muted-foreground">CSV files only (max 10MB)</p>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-3 flex items-center gap-2 text-destructive text-sm">
                <AlertCircle size={14} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {selectedFile && !error && (
              <Button className="w-full mt-5" onClick={handleConversion} disabled={loading}>
                {loading ? 'Processing...' : <>Continue to next step<ArrowRight size={14} className="ml-1.5" /></>}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Custom format entry */}
        <button
          onClick={handleCustomFormatClick}
          className="w-full text-left bg-background border border-border rounded-lg p-4 hover:border-primary/60 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <Layers size={16} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Upload data as GeoJSON, KML or your own format</p>
                <p className="text-xs text-muted-foreground mt-0.5">Have data in a different format? We can help you map it.</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
          </div>
        </button>

        {/* Requirements */}
        <Alert>
          <AlertCircle />
          <AlertTitle>File requirements</AlertTitle>
          <AlertDescription>
            <ul className="space-y-0.5">
              <li>Only CSV format is supported</li>
              <li>Maximum file size: 10MB</li>
              <li>Use the provided template structure</li>
              <li>Ensure data is properly formatted</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}

export default InfoSection
