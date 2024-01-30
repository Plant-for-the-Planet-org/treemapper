import React from 'react';
import i18next from 'i18next';
import Share from 'react-native-share';

import LargeButton from '../LargeButton';
import { toBase64 } from '../../../utils/base64';
import getGeoJsonData from '../../../utils/convertInventoryToGeoJson';

interface ExportGeoJSONProps {
  inventory: any;
}

const ExportGeoJSON: React.FunctionComponent<ExportGeoJSONProps> = ({ inventory }) => {
  const exportGeoJSONFile = async () => {
    if (inventory.polygons.length > 0) {
      const geoJSON = await getGeoJsonData({ inventoryData: inventory });

      const options = {
        url: 'data:application/json;base64,' + toBase64(JSON.stringify(geoJSON)),
        message: i18next.t('label.inventory_overview_export_json_message'),
        title: i18next.t('label.inventory_overview_export_json_title'),
        filename: `TreeMapper GeoJSON ${inventory.inventory_id}`,
        saveToFiles: true,
      };
      Share.open(options)
        .then(() => {
          alert(i18next.t('label.inventory_overview_export_json_success'));
        })
        .catch(err => {
          // shows error if occurred and not canceled by the user
          if (err?.error?.code != 'ECANCELLED500' && err?.message !== 'User did not share') {
            // iOS cancel button pressed
            alert(i18next.t('label.inventory_overview_export_json_error'));
          }
        });
    }
  };
  const onPressExportJSON = async () => {
    await exportGeoJSONFile();
  };

  return (
    <LargeButton
      onPress={onPressExportJSON}
      heading={i18next.t('label.inventory_overview_loc_export_json')}
      active={false}
      medium
    />
  );
};

export default ExportGeoJSON;
