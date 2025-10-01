import * as Haptics from 'expo-haptics';


export const errorHaptic = async () => {
    await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Error
    )
}

export const ctaHaptic = async() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
}