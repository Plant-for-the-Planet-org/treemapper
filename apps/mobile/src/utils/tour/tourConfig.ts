import i18next from 'i18next'
import type { TourGuideConfig } from '@wrack/react-native-tour-guide'

import { TourNextButton, TourPrevButton } from 'src/components/tour/TourNavButtons'
import { WHITE } from 'src/utils/constants/colors'

/**
 * The options every tour starts with.
 *
 * All eight tours carried an identical copy of this block, so anything meant
 * for all of them had to be written eight times. It is one function now; the
 * only thing a tour still passes is its own id.
 *
 * The part worth reading is `spotlightStyles`. The library draws the spotlight
 * as a *hole* punched out of the dark backdrop and nothing else: `enablePulse`
 * defaults to `false`, so without this block the step the user has to tap is
 * marked only by the absence of dimming. That reads fine over a dark photo and
 * is close to invisible over a white screen, which is most of this app -- and
 * it is invisible outright on a step whose target is the whole map, where the
 * hole covers everything there is to see. Since almost every step is
 * `interactive` and every pixel outside the hole is press-blocked, a user who
 * cannot find the hole cannot do anything at all.
 *
 * So: a white ring that breathes around the cutout, and a darker backdrop than
 * the 0.6 default so the hole reads as a hole. The ring is `pointerEvents:
 * 'none'` inside the library, so it never eats the tap it is pointing at.
 */
export const buildTourConfig = (tourId: string): TourGuideConfig => ({
  tourId,
  // Required by every `interactive` step: a Modal overlay swallows the touch
  // before it reaches the control the spotlight is pointing at.
  overlayMode: 'inline',
  showProgressDots: true,
  motion: 'morph',
  // Layout settles after each navigation push; measuring before it does puts
  // the spotlight on the previous screen's geometry.
  waitForInteractions: true,
  spotlightStyles: {
    overlayOpacity: 0.72,
    enablePulse: true,
    pulseColor: WHITE,
    pulseWidth: 3,
    pulseDuration: 1400,
    // Never fully fades out: the ring is the only thing marking where to tap,
    // so the low end of the breath still has to be readable.
    pulseMinOpacity: 0.45,
    pulseMaxOpacity: 1,
  },
  // Next and Back run the step's real handler, not just the overlay.
  components: {
    NextButton: TourNextButton,
    PrevButton: TourPrevButton,
  },
  nextButtonText: i18next.t('label.tour_next'),
  prevButtonText: i18next.t('label.tour_back'),
  skipButtonText: i18next.t('label.tour_skip'),
})
