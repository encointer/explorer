import React, { useEffect, useState, useRef } from 'react';
import { Map as LMap, TileLayer } from 'react-leaflet';
import * as L from 'leaflet';
import * as bs58 from 'bs58';

import { CurrenciesLayer } from './CurrenciesLayer';

import { useSubstrate } from './substrate-lib';
import { parseFixPoint, batchFetch } from './utils';

import 'leaflet/dist/leaflet.css';
import 'react-leaflet-markercluster/dist/styles.min.css';

const initialPosition = L.latLng(47.166168, 8.515495);

const toLatLng = location => [parseFixPoint(location.lon), parseFixPoint(location.lat)];

const tileSetup = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; OpenStreetMap contributors'
};

function Main (props) {
  let mapRef = useRef();
  const { api: { query: { encointerCurrencies: ec } } } = props;
  const [position, setPosition] = useState(initialPosition);
  const [currencies, setCurrencies] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState('');
  const [locations, setLocations] = useState({});
  const [details, setDetails] = useState({});

  /// Fetch locations for each currency in paralel; Save to state once ready
  const fetchGeodataPar = async (cids) => { /* eslint-disable no-multi-spaces */
    const keysBase58 = cids.map(bs58.encode);
    const kvReducer = (acc, data, idx) => { // conver array to key-value map
      acc[keysBase58[idx]] = data;          // where key is BASE58 of cid
      return acc;
    };

    console.log('FETCHING LOCATIONS');
    setLocations(
      await batchFetch(
        ec.locations,           // method to call
        cids,                   // array of parameters to method
        _ => _.map(toLatLng),   // convert I32F32 to LatLng
        kvReducer               // reduce to { CidInBase58: LatLng[], ... }
      )
    );

    console.log('FETCHING PROPERTIES');
    setDetails(                 // same as locations
      await batchFetch(ec.currencyProperties, cids, _ => _.toJSON(), kvReducer)
    );
  };

  // Load currencies identifiers once
  useEffect(() => {
    if (currencies.length === 0) {
      ec.currencyIdentifiers()
        .then(setCurrencies)
        .catch(err => console.error(err));
    }
  }, [currencies.length, ec]);

  /// Get locations
  useEffect(() => {
    if (currencies.length) {
      fetchGeodataPar(currencies);
    }
  }, [currencies]);

  /// Attempt geolocation
  useEffect(() => {
    const map = mapRef.current;
    if (map != null && position === initialPosition) {
      map.leafletElement.locate();
    }
  }, [mapRef, position]);

  /// Restet marker to my position
  const handleLocationFound = e => {
    setPosition(e.latlng);
    const map = mapRef.current.leafletElement;
    map.flyTo(e.latlng);
    map.setZoom(8);
    console.log(e);
  };

  /// Handler for click on currency marker
  const handleCurrencyMarkerClick = cid => {
    setSelectedCurrency(cid);
    const map = mapRef.current.leafletElement;
    const bounds = L.latLngBounds(locations[cid]).pad(2);
    map.panInsideBounds(bounds);
  };

  return (
    <div id="map-container" className={ selectedCurrency ? 'with-sidebar' : '' }>
      <LMap center={position} zoom={2} ref={mapRef}
        onLocationFound={handleLocationFound}>
        <TileLayer {...tileSetup} />
        <CurrenciesLayer locations={locations} onClick={handleCurrencyMarkerClick} selectedCurrency={selectedCurrency} />
      </LMap>
    </div>
  );
}

export default function Map (props) {
  const { api } = useSubstrate();
  return api.query ? (<Main api={api}/>) : null;
}
