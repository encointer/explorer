import React from 'react';
import { Marker, Circle, Tooltip } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';

export function CurrenciesLayer (props) {
  const { locations, details, onClick } = props;
  const layer = [];

  Object.keys(locations).forEach(cid => {
    const handleMarkerClick = _ => onClick(cid);
    const markers = locations[cid].map(
      (latLng, key) => (
        <Circle key={cid + '_' + key} center={latLng} fillColor="blue" radius={2000} onClick={handleMarkerClick}>
          <Tooltip>{
            details[cid] && details[cid].name_utf8
          }</Tooltip>
        </Circle>
      ));
    layer.push(...markers);
  });

  return (<MarkerClusterGroup>{layer}</MarkerClusterGroup>);
}
