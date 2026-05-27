'use client'

import React, { useState, useEffect } from 'react'
import { CheckCircle, XCircle, ArrowLeft, RefreshCw, FileText, Mail, ExternalLink } from 'lucide-react'
import ForestBulkLoader from './ForestBulkLoader'
import { createBulkIntervention } from '@shared-core/fetchApi/api.fetch'
import * as crypto from 'crypto'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const UploadSuccess = ({ validatedData, selectedProject, selectedSite, onBack, onStartOver, accessToken }: any) => {
  const [uploadState, setUploadState] = useState<'uploading' | 'success' | 'error'>('uploading')
  const [errorMessage, setErrorMessage] = useState('')

  const generateUid = (prefix: string) => `${prefix}_${crypto.randomBytes(16).toString('hex').substring(0, 24)}`

  const latLongToGeoJSON = (latitude: any, longitude: any) => {
    const lat = parseFloat(latitude)
    const lng = parseFloat(longitude)
    if (isNaN(lat) || isNaN(lng)) return null
    if (lat < -90 || lat > 90) return null
    if (lng < -180 || lng > 180) return null
    return { type: 'Point', coordinates: [lng, lat] }
  }

  const transformSpecies = (d: any[]) =>
    d.map((record) => ({
      clientId: generateUid('spc'),
      speciesName: record.name,
      isUnknown: true,
      otherSpeciesName: record.name,
      count: record.count,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))

  const transformDataForUpload = (data: any[]) =>
    data.map((record) => {
      const interventionType = record.TYPE !== 'single' ? 'multi-tree-registration' : 'single-tree-registration'
      const payload: any = {
        clientId: generateUid('inv'),
        type: interventionType,
        plantProject: selectedProject.id,
        interventionStartDate: new Date(record['PLANTATION START DATE']),
        interventionEndDate: new Date(record['PLANTATION END DATE']),
        geometry: latLongToGeoJSON(record['LATITUDE'], record['LONGITUDE']),
        treesPlanted: record['TREES PLANTED'],
        species: transformSpecies(record['SPECIES_DATA']),
        height: record['AVERAGE PLANT HEIGHT'],
        width: record['AVERAGE PLANT WIDTH'],
        tag: record['TAG'],
        metadata: {
          locationName: record['LOCATION NAME'],
          personName: record['PERSON NAME'],
          id: record['ID'],
          designation: record['DESIGNATION'],
          averageHeight: record['AVERAGE PLANT HEIGHT'],
          averageWidth: record['AVERAGE PLANT WIDTH'],
          tag: record['TAG'],
        },
      }
      if (selectedSite && selectedSite.id) payload.plantProjectSite = selectedSite.id
      return payload
    })

  const uploadData = async () => {
    try {
      setUploadState('uploading')
      const data = transformDataForUpload(validatedData)
      const response = await createBulkIntervention(accessToken, data, selectedProject.id)
      if (response.statusCode === 200 || response.statusCode === 201) {
        setUploadState('success')
      } else {
        throw new Error('Failed to upload data. Please try again.')
      }
    } catch (error: any) {
      setUploadState('error')
      setErrorMessage(error.message || 'An unexpected error occurred during upload.')
    }
  }

  useEffect(() => { uploadData() }, [])

  const SummaryRow = ({ label, value, tone = 'muted' }: { label: string; value: string; tone?: 'muted' | 'primary' | 'destructive' }) => (
    <div className="flex justify-between text-sm">
      <span className={
        tone === 'primary' ? 'text-primary/80' : tone === 'destructive' ? 'text-destructive/80' : 'text-muted-foreground'
      }>{label}:</span>
      <span className={
        tone === 'primary' ? 'font-medium text-primary' : tone === 'destructive' ? 'font-medium text-destructive' : 'font-medium text-foreground'
      }>{value}</span>
    </div>
  )

  const renderUploading = () => (
    <div className="text-center">
      <h2 className="text-lg font-semibold text-foreground mb-2">Uploading your data</h2>
      <p className="text-sm text-muted-foreground mb-6">Please wait while we process your plantation data...</p>
      <ForestBulkLoader />

      <Card className="max-w-md mx-auto mt-6 py-0 gap-0">
        <CardContent className="p-5 space-y-2">
          <SummaryRow label="Project" value={selectedProject.name} />
          {selectedSite && <SummaryRow label="Site" value={selectedSite.name} />}
          <SummaryRow label="Total records" value={String(validatedData.length)} />
        </CardContent>
      </Card>
    </div>
  )

  const renderSuccess = () => (
    <div className="text-center">
      <CheckCircle size={56} className="text-primary mx-auto mb-5" />
      <h2 className="text-xl font-semibold text-foreground mb-2">Upload successful</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Your plantation data has been successfully uploaded to TreeMapper.
      </p>

      <div className="bg-primary/10 border border-primary/20 rounded-lg p-5 max-w-md mx-auto mb-5 space-y-2">
        <SummaryRow label="Project" value={selectedProject.name} tone="primary" />
        {selectedSite && <SummaryRow label="Site" value={selectedSite.name} tone="primary" />}
        <SummaryRow label="Records uploaded" value={String(validatedData.length)} tone="primary" />
        <SummaryRow
          label="Upload date"
          value={new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          tone="primary"
        />
      </div>

      <div className="bg-muted/40 border border-border rounded-lg p-5 max-w-lg mx-auto mb-6 text-left">
        <div className="flex items-start gap-3">
          <FileText size={14} className="text-muted-foreground mt-1 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-1">What's next?</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Your uploaded data is now available in the TreeMapper dashboard. View and manage your interventions from the Intervention section.
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => (window.location.href = `/project/${selectedProject?.uid}/intervention`)}
              className="px-0 hover:bg-transparent text-primary hover:text-primary/80"
            >
              <ExternalLink size={14} className="mr-1.5" />
              Go to interventions
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 justify-center">
        <Button onClick={() => (window.location.href = `/project/${selectedProject?.uid}/intervention`)}>Go to intervention</Button>
        <Button variant="outline" onClick={() => (window.location.href = '/')}>Home</Button>
      </div>
    </div>
  )

  const renderError = () => (
    <div className="text-center">
      <XCircle size={56} className="text-destructive mx-auto mb-5" />
      <h2 className="text-xl font-semibold text-foreground mb-2">Upload failed</h2>
      <p className="text-sm text-muted-foreground mb-6">
        We encountered an issue while uploading your data. Please try again or contact support.
      </p>

      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-5 max-w-md mx-auto mb-5 text-left">
        <h3 className="text-sm font-semibold text-destructive mb-2">Error details</h3>
        <p className="text-sm text-destructive/80 mb-3">{errorMessage}</p>
        <div className="space-y-1.5">
          <SummaryRow label="Project" value={selectedProject.projectName} tone="destructive" />
          {selectedSite && <SummaryRow label="Site" value={selectedSite.name} tone="destructive" />}
          <SummaryRow label="Records" value={String(validatedData.length)} tone="destructive" />
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-5 max-w-lg mx-auto mb-6 text-left">
        <div className="flex items-start gap-3">
          <Mail size={14} className="text-amber-600 mt-1 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-1">Need help?</h3>
            <p className="text-sm text-muted-foreground mb-3">
              If the problem persists, please contact our support team with the error details above.
            </p>
            <a
              href="mailto:info@plant-for-the-planet.org"
              className="inline-flex items-center text-sm text-amber-700 dark:text-amber-400 hover:underline font-medium"
            >
              <Mail size={14} className="mr-1.5" />
              info@plant-for-the-planet.org
            </a>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 justify-center">
        <Button onClick={uploadData}>
          <RefreshCw size={14} className="mr-1.5" />
          Retry upload
        </Button>
        <Button variant="outline" onClick={() => onBack(4)}>
          <ArrowLeft size={14} className="mr-1.5" />
          Go back
        </Button>
      </div>
    </div>
  )

  return (
    <Card className="max-w-4xl mx-auto">
      <CardContent className="p-8 lg:p-12">
        {uploadState === 'uploading' && renderUploading()}
        {uploadState === 'success' && renderSuccess()}
        {uploadState === 'error' && renderError()}
      </CardContent>
    </Card>
  )
}

export default UploadSuccess
