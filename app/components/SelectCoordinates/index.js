import React from 'react';
import MapMarking from '../Common/MapMarking';
import { MULTI } from '../../utils/inventoryConstants';

export default function SelectCoordinates() {
  return <MapMarking treeType={MULTI} isPointForMultipleTree={true} activeMarkerIndex={0} />;
}
