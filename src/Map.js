import React, { useEffect, useState, createRef } from 'react';
import { Map as LMap, Marker, Popup, TileLayer, Circle, Tooltip } from 'react-leaflet';
import { SubstrateContextProvider, useSubstrate } from './substrate-lib';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const initialPosition = L.latLng(51.509, -0.11);
const parseFixPoint = raw => raw.toNumber() / 10 ** 9; // FIXME poor man fixed to float conversion

const toLatLng = location => L.latLng(parseFixPoint(location.lat), parseFixPoint(location.lon));

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

  // Load currencies identifiers once
  useEffect(() => {
    ec.currencyIdentifiers()
      .then(setCurrencies)
      .catch(err => console.error(err));
  }, []);

  // select first Currency, once
  useEffect(() => {
    if (currencies.length && !selectedCurrency) {
      setSelectedCurrency({ raw: currencies[0] });
    }
  }, [currencies, selectedCurrency]);

  // Get locations
  useEffect(() => {
    if (selectedCurrency && selectedCurrency.raw) {
      const cid = selectedCurrency.raw.toString();
      ec.locations(selectedCurrency.raw)
        .then(locs => setLocations({ ...locations, [cid]: locs.map(toLatLng) }))
        .catch(err => console.error(err));
    }
  }, [selectedCurrency]);

  // set marker of first found location
  useEffect(() => {
    if (Object.values(locations).length) {
      // console.log(locations);
      const spot = Object.values(locations)[0][0];
      setPosition(spot);
    }
  }, [locations]);

  // attempt geolocation
  useEffect(() => {
    const map = mapRef.current;
    if (map != null) {
      map.leafletElement.locate();
    }
  }, []);

  // restet marker to my position
  const handleLocationFound = e => {
    setPosition(e.latlng);
    console.log(e);
  };

  return (
    <LMap center={[0, 0]} zoom={2} ref={mapRef}
      onLocationFound={handleLocationFound}
      onLocationfound={handleLocationFound}
    >
      <TileLayer {...tileSetup} />
      <Circle
        center={position}
        fillColor="blue"
        radius={2000}>
        <Tooltip>test</Tooltip>
      </Circle>
      <Marker position={position}>
        <Popup>
          A pretty CSS3 popup. <br /> Easily customizable.
        </Popup>
      </Marker>
    </LMap>
  );
}

export default function Map (props) {
  const { api } = useSubstrate();
  return api.query ? (<div id="map-container"><Main api={api}/></div>) : null;
}
