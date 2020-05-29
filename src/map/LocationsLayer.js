import React from 'react';
import { Marker } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import * as L from 'leaflet';

const mark = new L.Icon({
  iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

/// Markers layer
export function LocationsLayer (props) {
  const { coords } = props.data;
  if (!coords || !coords.length) {
    return null;
  }
  return (<MarkerClusterGroup>{
    coords.map((pos, idx) => (<Marker position={pos} key={idx} icon={mark}/>))
  }</MarkerClusterGroup>);
}
