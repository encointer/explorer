import React, { useEffect, useState, createRef } from 'react';
import { Marker, Popup, TileLayer, Circle, Tooltip, LayerGroup, FeatureGroup } from 'react-leaflet';
import * as L from 'leaflet';

export function CurrenciesLayer (props) {
  const { locations, details } = props;
  const layer = [];

  Object.keys(locations).forEach(cid => {
    const markers = locations[cid].map(
      (latLng, key) => (
        <Circle key={cid + '_' + key} center={latLng} fillColor="blue" radius={2000} >
          <Tooltip>{
            details[cid] && details[cid].name_utf8
          }</Tooltip>
        </Circle>
      ));
    layer.push(...markers);
  });

  return layer;
}
