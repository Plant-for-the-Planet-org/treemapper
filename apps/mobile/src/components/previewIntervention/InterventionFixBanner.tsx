import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import React, { useState } from 'react'
import NetInfo from '@react-native-community/netinfo'
import { useToast } from 'react-native-toast-notifications'
import i18next from 'src/locales/index'
import { Colors, Typography } from 'src/utils/constants'
import { InterventionData } from 'src/types/interface/slice.interface'
import useInterventionManagement from 'src/hooks/realm/useInterventionManagement'
import { getSingleIntervention } from 'src/api/api.fetch'
import { convertInventoryToIntervention } from 'src/utils/helpers/interventionHelper/legacyInventoryIntervention'
import { ctaHaptic } from 'src/utils/helpers/hapticFeedbackHelper'

interface Props {
    intervention: InterventionData | null | undefined
}

/**
 * What is wrong with this intervention, in the user's own words.
 *
 * The list has room for a chip and nothing else, so "Incomplete data" was all a
 * user could see. The reason is stored on the record (fix_reason) from the
 * moment it is converted or an upload is refused, and this is where it is read
 * out.
 *
 * The button does what the record allows, which is two different things:
 *
 *  - Already on the server. Nothing here can be edited on the phone yet, so the
 *    button asks the server again. If the record was corrected on the dashboard
 *    the gaps disappear; if not, the banner says so rather than pretending the
 *    button did something.
 *  - Not uploaded yet. It was taken out of the sync queue so it would stop
 *    failing. The button clears that and puts it back, which is what editing was
 *    always meant to do.
 */
const InterventionFixBanner = ({ intervention }: Props) => {
    const { updateFixRequireIntervention, refreshSyncedIntervention } = useInterventionManagement()
    const toast = useToast()
    const [working, setWorking] = useState(false)

    if (!intervention || intervention.fix_required === 'NO') return null

    const isUploaded = intervention.status === 'SYNCED'

    const title = () => {
        switch (intervention.fix_required) {
            case 'INCOMPLETE_DATA': return i18next.t('label.intervention_incomplete_data')
            case 'SERVER_REJECTED': return i18next.t('label.intervention_upload_rejected')
            case 'PROJECT_ID_MISSING': return i18next.t('label.intervention_project_missing')
            case 'UNKNOWN': return i18next.t('label.intervention_unreadable_data')
            default: return i18next.t('label.intervention_fix_required')
        }
    }

    const help = () => {
        if (intervention.fix_required === 'INCOMPLETE_DATA') {
            return i18next.t('label.intervention_incomplete_help')
        }
        if (intervention.fix_required === 'SERVER_REJECTED') {
            return i18next.t('label.intervention_rejected_help')
        }
        return i18next.t('label.intervention_fix_generic_help')
    }

    // fix_reason holds one reason per line, so each gap gets its own bullet. A
    // reason may contain a full stop of its own, which is why this splits on the
    // line break and nothing else. A record stored before that, or a quarantine
    // detail, is a single line and reads as one bullet.
    const reasons = (intervention.fix_reason || '')
        .split('\n')
        .map(reason => reason.trim())
        .filter(reason => reason.length > 0)

    const checkAgain = async () => {
        const netInfo = await NetInfo.fetch()
        if (!netInfo.isConnected) {
            toast.show(i18next.t('label.intervention_fix_needs_internet'))
            return
        }
        try {
            const { response, success } = await getSingleIntervention(intervention.intervention_id)
            if (!success || !response?.data) {
                toast.show(i18next.t('label.intervention_fix_not_on_server'))
                return
            }
            const converted = convertInventoryToIntervention(response.data)
            if (!converted) {
                toast.show(i18next.t('label.intervention_fix_check_failed'))
                return
            }
            await refreshSyncedIntervention(converted)
            toast.show(converted.fix_required === 'NO'
                ? i18next.t('label.intervention_fix_updated')
                : i18next.t('label.intervention_fix_still_incomplete'))
        } catch (error) {
            toast.show(i18next.t('label.intervention_fix_check_failed'))
        }
    }

    const requeue = async () => {
        await updateFixRequireIntervention(intervention.intervention_id, 'NO', '')
        toast.show(i18next.t('label.intervention_fix_requeued'))
    }

    const handlePress = async () => {
        if (working) return
        ctaHaptic()
        setWorking(true)
        try {
            if (isUploaded) {
                await checkAgain()
            } else {
                await requeue()
            }
        } finally {
            setWorking(false)
        }
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.icon}>!</Text>
                <Text style={styles.title}>{title()}</Text>
            </View>
            <Text style={styles.help}>{help()}</Text>
            {reasons.map((reason) => (
                <View style={styles.reasonRow} key={reason}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.reason}>{reason}</Text>
                </View>
            ))}
            {isUploaded && (
                <Text style={styles.note}>{i18next.t('label.intervention_fix_on_dashboard')}</Text>
            )}
            <Pressable
                onPress={handlePress}
                disabled={working}
                style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
                accessibilityRole="button"
            >
                {working
                    ? <ActivityIndicator size="small" color={Colors.WHITE} />
                    : <Text style={styles.buttonLabel}>
                        {isUploaded
                            ? i18next.t('label.intervention_check_again')
                            : i18next.t('label.intervention_retry_upload')}
                    </Text>}
            </Pressable>
        </View>
    )
}

export default InterventionFixBanner

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
        marginBottom: 6,
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
    help: {
        fontSize: 12.5,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        color: Colors.DARK_TEXT_COLOR,
        lineHeight: 18,
        marginBottom: 6,
    },
    reasonRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 2,
    },
    bullet: {
        fontSize: 12.5,
        lineHeight: 18,
        marginRight: 6,
        color: Colors.DARK_TEXT_COLOR,
    },
    reason: {
        flex: 1,
        fontSize: 12.5,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        color: Colors.DARK_TEXT_COLOR,
        lineHeight: 18,
    },
    note: {
        marginTop: 8,
        fontSize: 12,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        color: Colors.TEXT_LIGHT,
        lineHeight: 17,
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
