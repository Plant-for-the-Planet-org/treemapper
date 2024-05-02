import React from 'react';
import i18next from 'src/locales/index';
import Share from 'react-native-share';

import { toBase64 } from 'src/utils/constants/base64';
import { convertInterventionDetailsToGeoJSON, convertTreeDetailsToGeoJSON } from 'src/utils/helpers/interventionHelper/convertDataToGeoJSON';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { scaleFont, scaleSize } from 'src/utils/constants/mixins';
import { View } from 'react-native';
import { Colors } from 'src/utils/constants';
import { FONT_FAMILY_BOLD } from 'src/utils/constants/typography';

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
            features.push({...treeFeature})
        }

        const geoJSON ={
            "type": "FeatureCollection",
            "features": [...features]
          }

        const options = {
            url: 'data:application/json;base64,' + toBase64(JSON.stringify(geoJSON)),
            message: i18next.t('label.inventory_overview_export_json_message'),
            title: i18next.t('label.inventory_overview_export_json_title'),
            filename: `TreeMapper GeoJSON`,
            saveToFiles: true,
        };
        Share.open(options)
            .then(() => {
                //
            })
            .catch(err => {
                // shows error if occurred and not canceled by the user
                if (err?.error?.code != 'ECANCELLED500' && err?.message !== 'User did not share') {
                    // iOS cancel button pressed
                    console.log("iOS cancel button pressed")
                }
            });

    };
    const onPressExportJSON = async () => {
        await exportGeoJSONFile();
    };

    return (
        <View style={styles.btnContainer}>
            <TouchableOpacity style={styles.wrapper} onPress={onPressExportJSON}>
                <Text style={styles.textStyle}>Export GeoJson</Text>
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
        backgroundColor: Colors.GRAY_BACKDROP + '1A',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 0.5,
        borderColor: Colors.GRAY_TEXT,
    },
    textStyle: {
        fontSize: scaleFont(18),
        fontFamily: FONT_FAMILY_BOLD,
        color: Colors.DARK_TEXT_COLOR,
    }
})