import ImageLabeling, { Label } from '@react-native-ml-kit/image-labeling'
import { AFTER_CAPTURE } from 'src/types/type/app.type'

/**
 * Offline "is this a tree?" check, run on the photo right after capture.
 *
 * Uses Google ML Kit's bundled image labeling model. The model ships inside
 * the app binary (no download at first use), so this works with no network.
 *
 * ML Kit's default label set (447 labels) has no literal "Tree" label, so a
 * photo counts as a tree when any vegetation label below clears
 * TREE_CONFIDENCE_THRESHOLD. The full label map lives at
 * https://developers.google.com/ml-kit/vision/image-labeling/label-map
 */

// Screens (TakePicture `screen` param) that belong to the intervention tree
// capture flow. Species, plot and remeasurement photos are not checked.
export const TREE_CHECK_SCREENS: AFTER_CAPTURE[] = [
  'SAMPLE_TREE',
  'EDIT_SAMPLE_TREE',
  'EDIT_INTERVENTION',
]

const TREE_LABELS = ['Plant', 'Flora', 'Forest', 'Jungle', 'Branch', 'Twig']

// The native module already drops labels below 0.5.
const TREE_CONFIDENCE_THRESHOLD = 0.6

// Labeling usually takes well under a second; never hold up the user longer.
const DETECTION_TIMEOUT_MS = 8000

export type TreeDetectionStatus = 'tree' | 'not_tree' | 'unavailable'

export interface TreeDetectionResult {
  status: TreeDetectionStatus
  // Highest confidence among the tree labels, 0 when none matched.
  confidence: number
  labels: Label[]
  error?: string
}

export const shouldRunTreeCheck = (screen: AFTER_CAPTURE) =>
  TREE_CHECK_SCREENS.includes(screen)

const withTimeout = <T>(promise: Promise<T>, ms: number) =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Tree detection timed out')), ms)
    promise.then(
      value => {
        clearTimeout(timer)
        resolve(value)
      },
      error => {
        clearTimeout(timer)
        reject(error)
      },
    )
  })

/**
 * Never throws. On any failure (module not linked, unreadable file, timeout)
 * it returns status 'unavailable' so the capture flow can carry on.
 */
export const detectTree = async (imageUri: string): Promise<TreeDetectionResult> => {
  try {
    const uri = imageUri.startsWith('file://') ? imageUri : `file://${imageUri}`
    const labels = await withTimeout(ImageLabeling.label(uri), DETECTION_TIMEOUT_MS)
    const confidence = labels
      .filter(label => TREE_LABELS.includes(label.text))
      .reduce((max, label) => Math.max(max, label.confidence), 0)
    return {
      status: confidence >= TREE_CONFIDENCE_THRESHOLD ? 'tree' : 'not_tree',
      confidence,
      labels,
    }
  } catch (error: any) {
    return {
      status: 'unavailable',
      confidence: 0,
      labels: [],
      error: error?.message || 'Unknown error',
    }
  }
}
