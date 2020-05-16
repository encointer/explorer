import React, { useEffect } from 'react';
import GeoJSON from 'geojson';
import * as L from 'leaflet';

import { Marker, Circle, Tooltip, TileLayer, withLeaflet } from 'react-leaflet';
import DeflateDefault from 'react-leaflet-deflate';

const Deflate = withLeaflet(DeflateDefault);

const Point = 'Point';
const Polygon = 'Polygon';
const single = _ => _.length === 1;
const pointOrPolygon = _ => single(_) ? Point : Polygon;

const makeIcon = _ => L.divIcon({ className: 'encoiner-community-icon', html: '<i>$</i>' });
const icon = makeIcon();

export function CurrenciesLayer (props) {
  const { locations, onClick, selectedCurrency } = props;
  const cids = Object.keys(locations);
  if (!cids.length) {
    return null;
  }

  const markers = Object.keys(locations).map(cid => (
    {
      cid,
      color: selectedCurrency === cid ? 'red' : 'blue',
      lat: locations[cid][0][1],
      lng: locations[cid][0][0],
      [pointOrPolygon(locations[cid])]: [locations[cid]]
    }));

  const data = GeoJSON.parse(markers, { [Point]: ['lat', 'lng'], Polygon, include: ['cid'] });

  const markerFn = (geoJsonPoint, latlng) => {
    return L.marker(latlng, { icon });
  };

  const polygonStyleFn = feature => { console.debug(feature); return { className: 'a', fillColor: 'blue', fill: true }; };

  return (
    <Deflate data={ [data] } minSize={ 50 } markerCluster={ true } style={polygonStyleFn}
      markerOptions={ { icon } } pointToLayer={markerFn}
      markerClusterOptions={{
        chunkedLoading: true,
        animate: true,
        animateAddingMarkers: true
        // singleMarkerMode: true
      }}
    ></Deflate>);
}
