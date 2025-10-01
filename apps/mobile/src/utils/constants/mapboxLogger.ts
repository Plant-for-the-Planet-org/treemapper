import {Logger} from '@maplibre/maplibre-react-native'

Logger.setLogCallback(log => {
  const {message} = log

  // expected warnings - see https://github.com/mapbox/mapbox-gl-native/issues/15341#issuecomment-522889062
  if (
    message.match('Request failed due to a permanent error: Canceled') ||
    message.match('Request failed due to a permanent error: Socket Closed') ||
    message.match('Request failed due to a permanent error: stream was reset: CANCEL ", "tag": "Mbgl-HttpRequest')
  ) {
    return true
  }
  return false
})
