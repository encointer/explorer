import React, { useEffect, useState, createRef } from 'react';
import { Map as LMap, Marker, Popup, TileLayer, Circle, Tooltip, LayerGroup, FeatureGroup } from 'react-leaflet';
import { SubstrateContextProvider, useSubstrate } from './substrate-lib';
import { CurrenciesLayer } from './CurrenciesLayer';
import * as L from 'leaflet';
import { parseFixPoint } from './utils';

import 'leaflet/dist/leaflet.css';
import 'react-leaflet-markercluster/dist/styles.min.css';

const initialPosition = L.latLng(51.509, -0.11);

const toLatLng = location => L.latLng(
  parseFixPoint(location.lat),
  parseFixPoint(location.lon));

const tileSetup = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; OpenStreetMap contributors'
};

function Main (props) {
  const mapRef = createRef();
  const { api: { query: { encointerCurrencies: ec } } } = props;
  const [position, setPosition] = useState(initialPosition);
  const [currencies, setCurrencies] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState();
  const [locations, setLocations] = useState({});
  const [details, setDetails] = useState({});

  // Fetch locations for each currency sequentialy
  const fetchGeodataSeq = async (cids) => {
    for (let idx = 0, len = cids.length; idx < len; idx++) {
      const cid = cids[idx];
      const locs = await ec.locations(cid);
      // convert I32F32 to LatLng
      setLocations({ ...locations, [cid]: locs.map(toLatLng) });
      const dets = await ec.currencyProperties(cid);
      setDetails({ ...details, [cid]: dets.toJSON() });
    }
  };

  // Fetch locations for each currency in paralel; Save to state once ready
  const fetchGeodataPar = (cids) => {
    console.log('FETCHING LOCATION');
    Promise
      .all(cids.map(cid => ec.locations(cid)))
      .then(locsRes => { // Called when all currencies locatins loads
        setLocations(
          locsRes.reduce((acc, locs, idx) => {
            const cid = cids[idx].toString();
            acc[cid] = locs.map(toLatLng); // convert I32F32 to LatLng
            return acc;
          }, {})
        );
      });
    console.log('FETCHING PROPERTIES');
    Promise
      .all(cids.map(cid => ec.currencyProperties(cid)))
      .then(propRes => { // Called when all currencies locatins loads
        setDetails(
          propRes.reduce((acc, details, idx) => {
            const cid = cids[idx].toString();
            acc[cid] = details.toJSON();
            return acc;
          }, {})
        );
      });
  };

  // Load currencies identifiers once
  useEffect(() => {
    if (currencies.length === 0) {
      ec.currencyIdentifiers()
        .then(setCurrencies)
        .catch(err => console.error(err));
    }
  }, [currencies.length, ec]);

  // Get locations
  useEffect(() => {
    if (currencies.length) {
      fetchGeodataPar(currencies);
    }
  }, [currencies]);

  // attempt geolocation
  useEffect(() => {
    const map = mapRef.current;
    if (map != null && position === initialPosition) {
      map.leafletElement.locate();
    }
  }, [mapRef, position]);

  // restet marker to my position
  const handleLocationFound = e => {
    setPosition(e.latlng);
    console.log(e);
  };

  return (
    <LMap center={position} zoom={2} ref={mapRef}
      onLocationFound={handleLocationFound}
      onLocationfound={handleLocationFound}
    >
      <TileLayer {...tileSetup} />
      <CurrenciesLayer map={mapRef} locations={locations} details={details} onClick={(_) => console.log(_)} selectedCurrency={selectedCurrency} />
    </LMap>
  );
}

export default function Map (props) {
  const { api } = useSubstrate();
  return api.query ? (<div id="map-container"><Main api={api}/></div>) : null;
}
