import React from 'react';
import i18next from 'src/locales/index';
import Share from 'react-native-share';
import { toBase64 } from 'src/utils/constants/base64';
import { convertInterventionDetailsToGeoJSON, convertTreeDetailsToGeoJSON } from 'src/utils/helpers/interventionHelper/convertDataToGeoJSON';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { scaleFont, scaleSize } from 'src/utils/constants/mixins';
import { Colors } from 'src/utils/constants';
import { FONT_FAMILY_BOLD } from 'src/utils/constants/typography';
import ExportIcon from 'assets/images/svg/ExportJsonIcon.svg'

interface Props {
    details: any;
    type: 'intervention' | 'treedetails'
}

export const ExportGeoJSONButton = (props: Props) => {
    const { details, type } = props;
    const exportGeoJSONFile = async () => {
        let features = [];
        if (type === 'intervention') {
            const interventionFeature = convertInterventionDetailsToGeoJSON(details);
            features = [...interventionFeature]
        } else {
            const treeFeature = convertTreeDetailsToGeoJSON(details);
            features.push({ ...treeFeature })
        }

        const geoJSON = {
            "type": "FeatureCollection",
            "features": [...features]
        }

        const options = {
            url: 'data:application/json;base64,' + toBase64(JSON.stringify(geoJSON)),
            message: i18next.t('label.inventory_overview_export_json_message'),
            title: i18next.t('label.inventory_overview_export_json_title'),
            filename: type === 'intervention' ? `Intervention_${details.intervention_id}_GeoJSON.json` : `Tree_${details.tree_id}_GeoJSON.json`,
            saveToFiles: true,
        };
        Share.open(options)
            .then(() => {
                //
            })
            .catch(() => {
                //error
            });

    };
    const onPressExportJSON = async () => {
        await exportGeoJSONFile();
    };

    return (
        <View style={styles.btnContainer}>
            <TouchableOpacity style={styles.wrapper} onPress={onPressExportJSON}>
                <View style={styles.iconWrapper}>
                    <ExportIcon />
                </View>
                <Text style={styles.textStyle}>{i18next.t("label.export_geo_json")}</Text>
            </TouchableOpacity>
        </View>

    );
};

export default ExportGeoJSONButton;


const styles = StyleSheet.create({
    btnContainer: {
        width: '100%',
        height: scaleSize(55),
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 10
    },
    wrapper: {
        width: '90%',
        height: '100%',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.WHITE,
        borderWidth: 0.5,
        borderColor: '#f2ebdd',
        shadowColor: Colors.GRAY_TEXT,
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 2
    },
    textStyle: {
        fontSize: scaleFont(18),
        fontFamily: FONT_FAMILY_BOLD,
        color: Colors.DARK_TEXT_COLOR,
    },
    iconWrapper: {
        position: "absolute",
        left: 10
    }
})