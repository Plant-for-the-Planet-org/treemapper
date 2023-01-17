import React from 'react';

import MapMarking from '../Common/MapMarking';
import { MULTI, OFF_SITE } from '../../utils/inventoryConstants';

export default function SelectCoordinates() {
  return (
    <MapMarking
      treeType={MULTI}
      isPointForMultipleTree={true}
      activeMarkerIndex={0}
      multipleLocateTree={OFF_SITE}
    />
  );
}
