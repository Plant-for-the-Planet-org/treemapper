import * as Haptics from 'expo-haptics';


export const errotHaptic = async () => {
    await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Error
    )
}

export const ctaHaptic = async() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
}