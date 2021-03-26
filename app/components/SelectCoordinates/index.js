import React from 'react';
import { MULTI } from '../../utils/inventoryConstants';
import MapMarking from '../Common/MapMarking';

export default function SelectCoordinates() {
  return <MapMarking treeType={MULTI} isPointForMultipleTree={true} activeMarkerIndex={0} />;
}
