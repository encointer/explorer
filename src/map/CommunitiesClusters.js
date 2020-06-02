import React from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import * as L from 'leaflet';

const DivIcon = L.divIcon;
const iconSize = [30, 30];

const icon = new DivIcon({
  iconSize,
  className: 'encoiner-community-icon',
  html: '<i>$</i>'
});
const selectedIcon = new DivIcon({
  iconSize: [2, 2],
  className: '',
  html: ''
});

/// communities markers layer with clusterisation
export function CommunitiesClusters (props) {
  const { cids, data, selected } = props;
  const handleMarkerClick = _ => _.sourceTarget.options.alt && props.onClick(_.sourceTarget.options.alt);
  return (<MarkerClusterGroup onClick={handleMarkerClick}> {
    cids.map(cid => {
      const { gps, name } = data[cid];
      const isSelected = selected === cid;
      return (
        <Marker key={cid} position={gps} alt={cid} icon={ isSelected ? selectedIcon : icon } >
          { !isSelected
            ? <Tooltip direction='top' offset={[0, iconSize[1] / -2]}>{name}</Tooltip>
            : null }
        </Marker>
      );
    })
  }</MarkerClusterGroup>);
}
