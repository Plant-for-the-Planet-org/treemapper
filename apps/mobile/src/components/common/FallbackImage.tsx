import React, { useEffect, useState } from 'react'
import { StyleProp } from 'react-native'
import { Image, ImageContentFit, ImageStyle } from 'expo-image'

interface Props {
  uri: string | null | undefined
  fallbackUri?: string | null
  style: StyleProp<ImageStyle>
  contentFit?: ImageContentFit
}

// expo-image has no fallback source prop, so swap the uri on the error event.
const FallbackImage = (props: Props) => {
  const { uri, fallbackUri, style, contentFit } = props
  const [failed, setFailed] = useState(false)

  // rows get recycled, so a failure must not stick to the next image
  useEffect(() => {
    setFailed(false)
  }, [uri])

  const source = failed ? fallbackUri : uri
  if (!source) {
    return null
  }

  return (
    <Image
      cachePolicy="memory-disk"
      source={{ uri: source }}
      recyclingKey={uri}
      style={style}
      contentFit={contentFit}
      onError={() => {
        // only the first failure swaps, so a broken fallback cannot loop
        if (!failed && fallbackUri) {
          setFailed(true)
        }
      }}
    />
  )
}

export default FallbackImage
