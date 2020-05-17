import React, { useEffect, useState, useRef } from 'react';
import { Map as LMap, TileLayer } from 'react-leaflet';
import * as L from 'leaflet';
import * as bs58 from 'bs58';

import { CommunitiesClusters } from './CommunitiesClusters';
import { LocationsLayer } from './LocationsLayer';
import { Sidebar } from './Sidebar';
import { useSubstrate } from './substrate-lib';
import { parseFixPoint, batchFetch } from './utils';

import 'leaflet/dist/leaflet.css';
import 'react-leaflet-markercluster/dist/styles.min.css';

const initialPosition = L.latLng(47.166168, 8.515495);

const toLatLng = location => [parseFixPoint(location.lat), parseFixPoint(location.lon)];

const tileSetup = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; OpenStreetMap contributors'
};

function Main (props) {
  const mapRef = useRef();
  const { api: { query: { encointerCurrencies: ec } } } = props;
  const [ui, setUI] = useState({ selected: '', dataLoaded: false });
  const [cids, setCids] = useState([]);
  const [hash, setHash] = useState([]);
  const [data, setData] = useState({});
  const [position, setPosition] = useState(initialPosition);

  /// Load currencies identifiers once
  useEffect(() => {
    if (cids.length === 0) {
      ec.currencyIdentifiers()
        .then(cids => {
          setCids(cids);
          setHash(cids.map(bs58.encode));
        })
        .catch(err => console.error(err));
    }
  }, [cids.length, ec]);

  /// Fetch locations for each currency in paralel; Save to state once ready
  async function fetchGeodataPar (cids, hash) { /* eslint-disable no-multi-spaces */
    const kvReducer = (acc, data, idx) => { // conver array to key-value map
      acc[hash[idx]] = data;          // where key is BASE58 of cid
      return acc;
    };

    console.log('FETCHING LOCATIONS AND PROPERTIES');
    const [locations, properties] = await Promise.all([
      await batchFetch(               // Fetching all Locations in parallel
        ec.locations,           // API: encointerCurrencies.locations(cid) -> Vec<Location>
        cids,                   // array of parameters to method
        _ => _.map(toLatLng)    // convert Location from I32F32 to LatLng
      ),                        // Fetching all Currency Properties
      await batchFetch(ec.currencyProperties, cids)]);

    console.log('SETTING DATA', locations, properties);
    setData(cids.map((cid, idx) => ({ // Shape of data in UI
      cid,                              // cid for back-reference
      coords: locations[idx],        // all coords
      gps: L.latLngBounds(locations[idx]).getCenter(),
      demurrage: parseFixPoint(properties[idx].demurrage_per_block, 32),
      name: properties[idx].name_utf8.toString()
    })).reduce(kvReducer, {}));
    setUI({ ...ui, dataLoaded: true });
  }

  /// Get locations effect
  useEffect(() => { /* eslint-disable react-hooks/exhaustive-deps */
    if (cids.length && cids.length === hash.length) {
      fetchGeodataPar(cids, hash);
    }
  }, [cids, hash]);

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
  };

  /// Handler for click on currency marker
  const handleCurrencyMarkerClick = cid => {
    const map = mapRef.current.leafletElement;
    setUI({ ...ui, selected: cid, prevZoom: map.getZoom() });
    const bounds = L.latLngBounds(data[cid].coords).pad(2);
    map.fitBounds(bounds);
  };

  /// Handler for sidebar closing
  const handleSidebarClosed = _ => {
    const map = mapRef.current.leafletElement;
    map.setZoom(ui.prevZoom);
    setUI({ ...ui, selected: '' });
  };

  useEffect(_ => {
    const map = mapRef.current && mapRef.current.leafletElement;
    map && setTimeout(_ => map.invalidateSize(), 50);
  }, [ui.selected]);

  return (
    <div id="map-container" className={ ui.selected ? 'with-sidebar' : '' }>
      <LMap center={position} zoom={4} ref={mapRef}
        onLocationFound={handleLocationFound}>
        <TileLayer {...tileSetup} />
        { ui.selected
          ? <LocationsLayer data={data[ui.selected]}/>
          : null }
        { ui.dataLoaded
          ? <CommunitiesClusters data={data} cids={hash} onClick={handleCurrencyMarkerClick} selected={ui.selected} />
          : null }
      </LMap>
      { ui.selected
        ? <Sidebar onClose={handleSidebarClosed} hash={ui.selected} data={data[ui.selected]} />
        : null }
    </div>
  );
}

export default function Map (props) {
  const { api } = useSubstrate();
  return api && api.query ? (<Main api={api}/>) : null;
}
