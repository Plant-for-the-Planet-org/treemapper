'use client'

import React, { useState } from 'react'
import InfoSection from './component/InfoSection'
import SelectProjectSite from './component/SelectProjectSite'
import DataValidation from './component/DataValidation'
import UploadSuccess from './component/UploadSuccess'
import { ArrowLeft, Check } from 'lucide-react'
import { useToken } from '@/context/useTokenContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type StepStatus = 'complete' | 'current' | 'upcoming'
type Step = { id: number; name: string; status: StepStatus }

const INITIAL_STEPS: Step[] = [
  { id: 1, name: 'Site', status: 'current' },
  { id: 2, name: 'Upload', status: 'upcoming' },
  { id: 3, name: 'Validate', status: 'upcoming' },
  { id: 4, name: 'Success', status: 'upcoming' },
]

const buildSteps = (current: number): Step[] =>
  INITIAL_STEPS.map((s) => ({
    ...s,
    status: s.id < current ? 'complete' : s.id === current ? 'current' : 'upcoming',
  }))

const Home = () => {
  const { accessToken } = useToken()
  const [currentStep, setCurrentStep] = useState(1)
  const [fileData, setFileData] = useState([])
  const [selectedProject, setSelectedProject] = useState({ name: '', id: '' })
  const [selectedSite, setSelectedSite] = useState({ name: '', id: '' })
  const router = useRouter()
  const steps = buildSteps(currentStep)

  const handleBack = () => {
    if (currentStep <= 1) router.back()
    else previousStep(currentStep)
  }

  const updateSteps = (i: number) => {
    if (i === 4) setCurrentStep(0)
    else setCurrentStep(i + 1)
  }

  const previousStep = (i: number) => {
    if (i > 1) setCurrentStep(i - 1)
  }

  const handleProjectValidations = (validatedData: any, i: number) => {
    updateSteps(i)
    setFileData(validatedData)
  }

  const handleFinalSelection = ({ projectName, siteName, projectId, siteId }: any, i: number) => {
    setSelectedProject({ name: projectName, id: projectId })
    setSelectedSite({ name: siteName, id: siteId || null })
    updateSteps(i)
  }

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 w-full h-full">
      {currentStep > 1 && (
        <div className="flex items-center justify-between gap-3 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="-ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={14} className="mr-1" />
            Back
          </Button>
          {selectedSite.name && selectedSite.name !== 'No site selected' && (
            <span className="text-xs text-muted-foreground truncate">
              Site: <span className="font-medium text-foreground">{selectedSite.name}</span>
            </span>
          )}
        </div>
      )}

      <nav aria-label="Progress" className="mb-8">
        <ol className="flex items-center w-full">
          {steps.map((step, stepIdx) => (
            <React.Fragment key={step.name}>
              <li className="flex items-center gap-2 flex-shrink-0">
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full border-2 bg-background',
                    step.status === 'upcoming' ? 'border-border' : 'border-primary',
                  )}
                >
                  {step.status === 'complete' ? (
                    <Check size={12} className="text-primary" />
                  ) : step.status === 'current' ? (
                    <span className="h-2 w-2 rounded-full bg-primary" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                  )}
                </div>
                <span
                  className={cn(
                    'text-xs font-medium whitespace-nowrap hidden sm:inline',
                    step.status === 'current' ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {step.name}
                </span>
              </li>
              {stepIdx !== steps.length - 1 && (
                <div
                  aria-hidden="true"
                  className={cn(
                    'flex-1 h-0.5 mx-2 sm:mx-3',
                    step.status === 'complete' ? 'bg-primary' : 'bg-border',
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </ol>
      </nav>

      {currentStep === 1 && (
        <SelectProjectSite
          onBack={previousStep}
          accessToken={accessToken}
          handleFinalSelection={handleFinalSelection}
        />
      )}
      {currentStep === 2 && (
        <InfoSection
          setFileData={setFileData}
          updateStep={updateSteps}
          selectedProject={selectedProject}
          selectedSite={selectedSite}
        />
      )}
      {currentStep === 3 && (
        <DataValidation fileData={fileData} onBack={previousStep} onNext={handleProjectValidations} />
      )}
      {currentStep === 4 && (
        <UploadSuccess
          validatedData={fileData}
          selectedProject={selectedProject}
          selectedSite={selectedSite}
          onBack={previousStep}
          onStartOver={updateSteps}
          accessToken={accessToken}
        />
      )}
    </div>
  )
}

export default Home
