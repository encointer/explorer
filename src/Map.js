import React, { useEffect, useState, useRef } from 'react';
import { Map as LMap, TileLayer } from 'react-leaflet';
import { Sidebar, Responsive, Segment } from 'semantic-ui-react';
import * as L from 'leaflet';
import * as bs58 from 'bs58';

import { useSubstrate } from './substrate-lib';

import MapMenu from './MapMenu';
import MapBlockNumber from './MapBlockNumber';
import MapNodeInfo from './MapNodeInfo';
import MapControl from './MapControl';
import MapSidebar from './MapSidebar';

import { CommunitiesClusters } from './CommunitiesClusters';
import { LocationsLayer } from './LocationsLayer';
import { parseFixPoint, batchFetch } from './utils';

import 'leaflet/dist/leaflet.css';
import 'react-leaflet-markercluster/dist/styles.min.css';

const initialPosition = L.latLng(47.166168, 8.515495);

const toLatLng = location => [parseFixPoint(location.lat), parseFixPoint(location.lon)];

const tileSetup = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
};

const blocksPerMonth = 438300;

function MapMain (props) {
  const mapRef = useRef();
  const { api } = useSubstrate();

  const [ui, setUI] = useState({ selected: '', loading: true });
  const [cids, setCids] = useState([]);
  const [hash, setHash] = useState([]);
  const [data, setData] = useState({});
  const [position, setPosition] = useState(initialPosition);

  const ec = api && api.query && api.query.encointerCurrencies;

  /// Fetch locations for each currency in paralel; Save to state once ready
  async function fetchGeodataPar (cids, hash) { /* eslint-disable no-multi-spaces */
    const kvReducer = (acc, data, idx) => { // conver array to key-value map
      acc[hash[idx]] = data;                // where key is BASE58 of cid
      return acc;
    };

    console.log('FETCHING LOCATIONS AND PROPERTIES');
    const [locations, properties] = await Promise.all([
      await batchFetch(         // Fetching all Locations in parallel
        ec.locations,           // API: encointerCurrencies.locations(cid) -> Vec<Location>
        cids,                   // array of parameters to method
        _ => _.map(toLatLng)    // convert Location from I32F32 to LatLng
      ),                        // Fetching all Currency Properties
      await batchFetch(ec.currencyProperties, cids)]);

    console.log('SETTING DATA', locations, properties);
    setData(cids.map((cid, idx) => ({ // Shape of data in UI
      cid,                            // cid for back-reference
      coords: locations[idx],         // all coords
      gps: L.latLngBounds(locations[idx]).getCenter(),
      demurrage: properties[idx].demurrage_per_block.toNumber() * blocksPerMonth,
      name: properties[idx].name_utf8.toString()
    })).reduce(kvReducer, {}));
    setUI({ ...ui, loading: false });
  }

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

  /// Update map after resize
  useEffect(_ => {
    const map = mapRef.current && mapRef.current.leafletElement;
    map && setTimeout(_ => map.invalidateSize(), 50);
  }, [ui.sidebarSize]);

  /// Handler generator for zoom in/out
  function handlerZoom (s) {
    return () => mapRef.current.leafletElement[s < 0 ? 'zoomOut' : 'zoomIn']();
  }

  /// Resize leaflet map when sidebar shown
  function calcMapOffset () {
    const full = '100%';
    // should reposition markers in portrait mode if sidebar shown
    if (ui.portrait && ui.selected && ui.sidebarSize && mapRef.current !== null) {
      const offset = mapRef.current.container.offsetHeight - ui.sidebarSize;
      return `${offset}px`;
    }
    return full;
  }

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

  /// Handler for window resize
  const handleResponsibleUpdate = (_, { width }) =>
    setUI({ ...ui, portrait: width < Responsive.onlyMobile.maxWidth, width });

  /// Handler for sidebar closing
  const handleSidebarClosed = _ => {
    const map = mapRef.current.leafletElement;
    map.setZoom(ui.prevZoom);
    setUI({ ...ui, selected: '', sidebarSize: 0 });
  };

  /// Handler for sidebar shows completely
  const handleSidebarShow = sidebarSize =>
    setUI({ ...ui, sidebarSize, menu: false });

  /// Show left side menu
  const toggleMenu = () =>
    setUI({ ...ui, menu: !ui.menu });

  /// Close left side menu if clicked
  const handleMapClick = () =>
    ui.menu && setUI({ ...ui, menu: false });

  return (
    <Responsive
      as={Segment.Group}
      className='encointer-map'
      fireOnMount
      onUpdate={handleResponsibleUpdate}>

      <Sidebar.Pushable as={Segment}  className='component-wrapper'>

        <MapMenu visible={ui.menu} />

        <MapSidebar
          onClose={handleSidebarClosed}
          onShow={handleSidebarShow}
          hash={ui.selected}
          direction={ui.portrait ? 'bottom' : 'right'}
          width='very wide'
          data={data[ui.selected] || {}}
        />

        <Sidebar.Pusher className='encointer-map-wrapper'
          style={ { marginRight: ui.portrait ? '0' : ui.sidebarSize + 'px' } }>

          <MapBlockNumber />

          <MapNodeInfo />

          <MapControl
            onClick={toggleMenu}
            loading={ui.loading}
            onZoomIn={handlerZoom(1)}
            onZoomOut={handlerZoom(-1)} />

          <LMap
            center={position}
            zoom={4}
            ref={mapRef}
            zoomControl={false}
            touchZoom={true}
            onClick={handleMapClick}
            style={{ height: calcMapOffset() }}
            onLocationFound={handleLocationFound}>

            <TileLayer {...tileSetup} />

            { ui.selected
              ? <LocationsLayer data={data[ui.selected]} />
              : null }

            { !ui.loading
              ? <CommunitiesClusters
                data={data}
                cids={hash}
                onClick={handleCurrencyMarkerClick}
                selected={ui.selected} />
              : null }

          </LMap>

        </Sidebar.Pusher>

      </Sidebar.Pushable>

    </Responsive>
  );
}

export default function Map (props) {
  const { api } = useSubstrate();
  return api && api.query && api.query.encointerCurrencies ? <MapMain /> : null;
}
