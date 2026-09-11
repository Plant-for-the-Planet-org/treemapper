import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import React, { useState } from 'react'
import { Colors, Typography } from 'src/utils/constants'
import { MonitoringPlot } from 'src/types/interface/slice.interface'
import useMonitoringPlotManagement from 'src/hooks/realm/useMonitoringPlotManagement'
import { useToast } from 'react-native-toast-notifications'
import { ctaHaptic } from 'src/utils/helpers/hapticFeedbackHelper'
import i18next from 'src/locales/index'

interface Props {
    plot: MonitoringPlot | null | undefined
}

/**
 * Why a plot will not upload, and a button that tries to put it right.
 *
 * The list only has room for a "Fix required" chip, so this is where the reason
 * lives. Telling the user to "edit anything and save" asked them to guess, so
 * the button does the guessing: it repairs what is mechanical (dates the wrong
 * way round, a centre that was never computed, text longer than the column) and
 * re-queues the plot.
 *
 * When something is left that only a person can settle, the button says so
 * instead of re-queueing. Re-queueing a plot that will fail again is worse than
 * doing nothing, because it teaches the user the button is decorative.
 */
const PlotFixBanner = ({ plot }: Props) => {
    const { repairPlot } = useMonitoringPlotManagement()
    const toast = useToast()
    const [fixing, setFixing] = useState(false)

    if (!plot || plot.fix_required === 'NO') return null

    const title = plot.fix_required === 'SERVER_REJECTED'
        ? i18next.t('label.plot_upload_rejected')
        : plot.fix_required === 'UNKNOWN'
            ? i18next.t('label.plot_incomplete_data')
            : i18next.t('label.plot_fix_required')

    const handleFix = async () => {
        if (fixing) return
        ctaHaptic()
        setFixing(true)
        const result = await repairPlot(plot.plot_id)
        setFixing(false)

        if (result.requeued) {
            toast.show(
                result.repaired.length > 0
                    ? `${result.repaired.join(' ')} ${i18next.t('label.plot_fix_requeued')}`
                    // Nothing was wrong that this could see, so the plot is
                    // queued to try again rather than claimed as fixed.
                    : i18next.t('label.plot_fix_nothing_found'),
                { textStyle: { textAlign: 'center' } },
            )
            return
        }
        // The banner itself now shows the blockers, so the toast only needs to
        // say that this is not something the button can settle.
        toast.show(i18next.t('label.plot_fix_needs_you'), { textStyle: { textAlign: 'center' } })
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.icon}>!</Text>
                <Text style={styles.title}>{title}</Text>
            </View>
            {!!plot.fix_reason && <Text style={styles.reason}>{plot.fix_reason}</Text>}
            <Pressable
                onPress={handleFix}
                disabled={fixing}
                style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
                accessibilityRole="button"
            >
                {fixing
                    ? <ActivityIndicator size="small" color={Colors.WHITE} />
                    : <Text style={styles.buttonLabel}>{i18next.t('label.plot_fix_action')}</Text>}
            </Pressable>
        </View>
    )
}

export default PlotFixBanner

const styles = StyleSheet.create({
    container: {
        marginHorizontal: '5%',
        marginTop: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: Colors.ALERT + '14',
        borderWidth: 1,
        borderColor: Colors.ALERT + '55',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    icon: {
        width: 16,
        height: 16,
        lineHeight: 16,
        marginRight: 8,
        textAlign: 'center',
        borderRadius: 8,
        overflow: 'hidden',
        fontSize: 11,
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        color: Colors.WHITE,
        backgroundColor: Colors.ALERT,
    },
    title: {
        flex: 1,
        fontSize: 13,
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        color: Colors.ALERT,
        letterSpacing: 0.2,
    },
    reason: {
        fontSize: 12.5,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        color: Colors.DARK_TEXT_COLOR,
        lineHeight: 18,
    },
    button: {
        marginTop: 10,
        height: 34,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.NEW_PRIMARY,
    },
    buttonPressed: {
        opacity: 0.85,
    },
    buttonLabel: {
        fontSize: 13,
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        color: Colors.WHITE,
        letterSpacing: 0.3,
    },
})
