import React, { useEffect, useState, useRef, useReducer } from 'react';
import { Map as LMap, TileLayer } from 'react-leaflet';
import { Sidebar, Responsive, Segment } from 'semantic-ui-react';
import * as L from 'leaflet';
import * as bs58 from 'bs58';
import { u32 as U32 } from '@polkadot/types/primitive';

import { useSubstrate } from './substrate-lib';
import { DeveloperConsole } from './substrate-lib/components';

import MapMenu from './map/MapMenu';
import MapCeremonyPhases from './map/MapCeremonyPhases';
import MapNodeInfo from './map/MapNodeInfo';
import MapControl from './map/MapControl';
import MapSidebar from './map/MapSidebar';

import { CommunitiesClusters } from './map/CommunitiesClusters';
import { LocationsLayer } from './map/LocationsLayer';
import { parseI32F32, parseI64F64, batchFetch } from './utils';

import 'leaflet/dist/leaflet.css';
import 'react-leaflet-markercluster/dist/styles.min.css';

const initialPosition = L.latLng(47.166168, 8.515495);

/// Parse only 16 bits of fractional part
const parseLatLng = _ => parseI32F32(_, 16);

const toLatLng = location => [
  parseLatLng(location.lat),
  parseLatLng(location.lon)
];

const BLOCKS_PER_MONTH = (86400 / 6) * (356 / 12);

const parseDemurrage = _ => (1 - Math.exp(-1 * parseI64F64(_) * BLOCKS_PER_MONTH)) * 100;

const tileSetup = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
};

const apiReady = (api, queryName = '') => {
  const query = api && api.queryMulti && api.query;
  return query && queryName ? (!!query[queryName]) : !!query;
};

// Ceremony Phases
const ceremonyPhases = {
  REGISTERING: 0,
  ASSIGNING: 1,
  ATTESTING: 2
};

const sumUp = obj => Object.keys(obj).reduce((acc, it) => { acc = acc + obj[it]; return acc; }, 0);

const initialState = {
  subscribtionCeremony: 0,
  subscribtionPhase: -1,
  lastCeremony: {
    participants: {},
    meetups: {},
    attestations: {}
  },
  subscribtions: [],
  participantCount: 0,
  meetupCount: 0,
  attestationCount: 0,
  participants: {},
  meetups: {},
  attestations: {}
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'unsubscribeAll':
      state.subscribtions.forEach(unsub => unsub());
      return { ...state, subscribtions: [] };

    case 'subscribe':
      state.subscribtions.forEach(unsub => unsub());
      return { ...state, ...action.payload };

    case 'participants':
      return ((state, action) => {
        const participants = { ...state.participants, [action.payload.cid]: action.payload.count };
        const participantCount = sumUp(participants);
        return { ...state, participants, participantCount };
      })(state, action);

    case 'meetups':
      return ((state, action) => {
        const meetups = { ...state.meetups, [action.payload.cid]: action.payload.count };
        const meetupCount = sumUp(meetups);
        return { ...state, meetups, meetupCount };
      })(state, action);

    case 'attestations':
      return ((state, action) => {
        const attestations = { ...state.attestations, [action.payload.cid]: action.payload.count };
        const attestationCount = sumUp(attestations);
        return {
          ...state,
          attestations,
          attestationCount
        };
      })(state, action);

    case 'last':
      return {
        ...state,
        lastCeremony: action.payload
      };

    case 'reset':
      state.subscribtions.forEach(unsub => unsub());
      if (state.subscribtionCeremony && state.subscribtionCeremony !== state.lastCeremony.subscribtionCeremony) {
        return {
          ...initialState,
          lastCeremony: {
            subscribtionCeremony: state.subscribtionCeremony,
            meetups: { ...state.meetups },
            meetupCount: state.meetupCount,
            attestations: { ...state.attestations },
            attestationCount: state.attestationCount,
            participants: { ...state.participants },
            participantCount: state.participantCount,
            subscribtions: null,
            lastCeremony: null
          }
        };
      } else {
        return state;
      }

    default:
      throw new Error('unknown action '.concat(action.type));
  }
};

const setters = ['participants', 'meetups', 'attestations']; // action names for each phase

export default function Map (props) {
  const { debug } = props;
  const mapRef = useRef();
  const { api } = useSubstrate();

  const [ui, setUI] = useState({ selected: '', loading: true, menu: false });
  const [cids, setCids] = useState([]);
  const [hash, setHash] = useState([]);
  const [data, setData] = useState({});
  const [position, setPosition] = useState(initialPosition);
  const [currentPhase, setCurrentPhase] = useState({ phase: -1, timestamp: 0, timer: null });
  const [ceremonyIndex, setCeremonyIndex] = useState(0);
  const [state, dispatch] = useReducer(reducer, initialState);

  const ec = api && api.query && api.query.encointerCurrencies;
  const es = api && api.query && api.query.encointerScheduler;

  /// Fetch locations for each currency in parallel; Save to state once ready
  async function fetchGeodataPar (cids, hash) { /* eslint-disable no-multi-spaces */
    const kvReducer = (acc, data, idx) => { // convert array to key-value map
      acc[hash[idx]] = data;                // where key is BASE58 of cid
      return acc;
    };

    debug && console.log('FETCHING LOCATIONS AND PROPERTIES');
    const [locations, properties] = await Promise.all([
      await batchFetch(         // Fetching all Locations in parallel
        ec.locations,           // API: encointerCurrencies.locations(cid) -> Vec<Location>
        cids,                   // array of parameters to method
        _ => _.map(toLatLng)    // convert Location from I32F32 to LatLng
      ),                        // Fetching all Currency Properties
      await batchFetch(ec.currencyProperties, cids)]);

    debug && console.log('SETTING DATA', locations, properties);
    setData(cids.map((cid, idx) => ({ // Shape of data in UI
      cid,                            // cid for back-reference
      coords: locations[idx],         // all coords
      gps: L.latLngBounds(locations[idx]).getCenter(),
      demurrage: parseDemurrage(properties[idx].demurrage_per_block),
      name: properties[idx].name_utf8.toString()
    })).reduce(kvReducer, {}));
    setUI({ ...ui, loading: false });
  }

  /// Update current phase and set update timeout
  useEffect(() => {
    debug && console.log('phases', currentPhase);
    if (!apiReady(api, 'encointerScheduler')) {
      return;
    }

    const {
      encointerScheduler: {
        currentPhase: getCurrentPhase,
        nextPhaseTimestamp: getNextPhaseTimestamp
      }
    } = api.query;

    const setPhase = (phase, timestamp, timer) => {
      (currentPhase.phase !== phase || currentPhase.timestamp !== timestamp || !timer) &&
        setCurrentPhase({ phase, timestamp, timer });
    };

    if (!currentPhase.timer) {
      api.queryMulti([
        getCurrentPhase,
        getNextPhaseTimestamp
      ])
        .then(([newPhase, newPhaseTimestamp]) => {
          const phase = newPhase.toNumber();
          const timestamp = newPhaseTimestamp.toNumber();
          let timeToNext = timestamp - Date.now() + 500;
          if (timeToNext <= 0) {
            timeToNext = 3000; // delay if timestamp in the past
          }
          const timer = currentPhase.timer === null && // reset phase timer
                setTimeout(() => setPhase(phase, timestamp, null), timeToNext);
          timer && setPhase(phase, timestamp, timer); // update if have new timer
        })
        .catch(console.error);
    }
    return () => {
      currentPhase.timer && clearTimeout(currentPhase.timer);
    };
  }, [currentPhase, debug, es, api]);

  /// Update ceremony index once registration phase starts
  useEffect(() => { /* eslint-disable react-hooks/exhaustive-deps */
    if (!apiReady(api, 'encointerScheduler')) {
      return;
    }
    const {
      encointerScheduler: {
        currentCeremonyIndex: getCurrentCeremonyIndex
      }
    } = api.query;
    debug && console.log('ceremony id', currentPhase.phase, ceremonyIndex);
    const CurrencyCeremony = api.registry.getOrUnknown('CurrencyCeremony');

    /// Fetch participants and meetups counters
    const fetchHistoricData = async (ceremony, phase, cids) => {
      if (!apiReady(api, 'encointerCeremonies')) {
        return;
      }
      const ceremonyNumber = ceremony.toNumber();
      if (ceremonyNumber <= state.subscribtionCeremony && phase === 0) {
        return;
      }
      const {
        encointerCeremonies: {
          participantCount: getParticipantCount,
          meetupCount: getMeetupCount
        }
      } = api.query;
      // Previous Phases of current Ceremony
      for (let oldPhase = 0; oldPhase < phase; oldPhase++) {
        cids.forEach(cid => {
          const currencyCeremony = new CurrencyCeremony(api.registry, [cid, ceremony]);
          const getters = [getParticipantCount, getMeetupCount];
          const getter = getters[oldPhase];
          debug && console.log('hist ', bs58.encode(cid), ceremony.toNumber(), oldPhase);
          getter(currencyCeremony).then((_) => dispatch({
            type: setters[oldPhase],
            payload: {
              cid: bs58.encode(cid),
              count: _.toNumber()
            }
          }));
        });
      }
    };

    /// Fetch participants and meetups counters
    const fetchLastCeremony = async (ceremony, cids) => {
      if (!apiReady(api, 'encointerCeremonies')) {
        return;
      }
      const {
        encointerCeremonies: {
          participantCount: getParticipantCount,
          meetupCount: getMeetupCount
        }
      } = api.query;
      // Last Ceremony
      const lastCeremony = ceremony.sub(new U32(api.registry, 1));
      const lastCeremonyData = await Promise.all(cids.map(cid => {
        const currencyCeremony = new CurrencyCeremony(api.registry, [cid, lastCeremony]);
        return api.queryMulti([
          [getParticipantCount, currencyCeremony],
          [getMeetupCount, currencyCeremony]
        ]);
      }));
      const payload = lastCeremonyData.reduce((acc, data, idx) => {
        const cid = bs58.encode(cids[idx]);
        const [participantCount, meetupCount] = data;
        acc.meetups[cid] = meetupCount.toNumber();
        acc.participants[cid] = participantCount.toNumber();
        acc.participantCount = acc.participants[cid] + acc.participantCount;
        acc.meetupCount = acc.meetups[cid] + acc.meetupCount;
        return acc;
      }, {
        subscribtionCeremony: lastCeremony.toNumber(),
        meetups: {},
        participants: {},
        participantCount: 0,
        meetupCount: 0
      });
      dispatch({
        type: 'last',
        payload
      });
    };

    /// Subscription management via reducer
    const subscribeToUpdates = async function (ceremony, phase, cids) {
      if (!apiReady(api, 'encointerCeremonies')) {
        return;
      }
      const ceremonyNumber = ceremony.toNumber();
      if (ceremonyNumber <= state.subscribtionCeremony && phase <= state.subscribtionPhase) {
        return;
      }

      debug && console.log('subscribe to ceremony', ceremonyNumber, phase);
      const {
        encointerCeremonies: {
          participantCount: getParticipantCount,
          attestationCount: getAttestationCount,
          meetupCount: getMeetupCount
        }
      } = api.query;
      const getters = [getParticipantCount, getMeetupCount, getAttestationCount];
      const CurrencyCeremony = api.registry.getOrUnknown('CurrencyCeremony');
      const unsubs = await Promise.all(cids.map(cid => {
        const currencyCeremony = new CurrencyCeremony(api.registry, [cid, ceremonyIndex]);
        const getter = getters[phase];
        return getter(currencyCeremony, (_) => dispatch({
          type: setters[phase],
          payload: {
            cid: bs58.encode(cid),
            count: _.toNumber()
          }
        }));
      }));

      dispatch({
        type: 'subscribe',
        payload: {
          subscribtions: unsubs,
          subscribtionCeremony: ceremonyNumber,
          subscribtionPhase: phase
        }
      });
    };

    if (!ceremonyIndex) {
      getCurrentCeremonyIndex().then((currentCeremonyIndex) => {
        console.log('set ceremonyIndex', currentCeremonyIndex.toString());
        setCeremonyIndex(currentCeremonyIndex);
      });
    }
    if (ceremonyIndex &&
        (ceremonyIndex.toNumber() !== state.subscribtionCeremony ||
         currentPhase.phase !== state.subscribtionPhase) &&
        cids.length) {
      subscribeToUpdates(ceremonyIndex, currentPhase.phase, cids);
      fetchHistoricData(ceremonyIndex, currentPhase.phase, cids);
      !state.lastCeremony.subscribtionCeremony && fetchLastCeremony(ceremonyIndex, cids);
    }
    if (currentPhase.phase === ceremonyPhases.REGISTERING) {
      state.subscribtionCeremony !== state.lastCeremony.subscribtionCeremony &&
        dispatch({ type: 'reset' }); // reset state on start of new ceremony
      getCurrentCeremonyIndex().then((currentCeremonyIndex) => {
        debug && console.log('set ceremonyIndex', currentCeremonyIndex.toString());
        setCeremonyIndex(currentCeremonyIndex);
      });
    }
  }, [currentPhase.phase, ceremonyIndex, cids, es, debug, api, setters]);

  /// Load currencies identifiers once
  useEffect(() => {
    debug && console.log('cids', cids);

    if (ec && cids.length === 0) {
      ec.currencyIdentifiers()
        .then(cids => {
          const hashes = cids.map(bs58.encode);
          setCids(cids);
          setHash(hashes);
        })
        .catch(err => console.error(err));
    }
  }, [cids, debug, ec]);

  /// Get locations effect
  useEffect(() => { /* eslint-disable react-hooks/exhaustive-deps */
    debug && console.log('get locations');
    if (cids.length && cids.length === hash.length) {
      fetchGeodataPar(cids, hash);
    }
  }, [cids, hash]);

  /// Attempt geolocation
  useEffect(() => {
    debug && console.log('get position');
    const map = mapRef.current;
    if (map != null && position === initialPosition) {
      map.leafletElement.locate();
    }
  }, [mapRef, position]);

  /// Update map after resize
  useEffect(() => {
    debug && console.log('update resize');
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
      if (mapRef.current.container.style.height === '100%') {
        const offset = mapRef.current.container.offsetHeight - ui.sidebarSize;
        return `${offset}px`;
      } else {
        return mapRef.current.container.style.height;
      }
    }
    return full;
  }

  /// Reset marker to my position
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
  const handleSidebarClosed = () => {
    const map = mapRef.current.leafletElement;
    map.setZoom(ui.prevZoom);
    setUI({ ...ui, selected: '', sidebarSize: 0 });
  };

  /// Handler for sidebar shows completely
  const handleSidebarShow = sidebarSize =>
    setUI({ ...ui, sidebarSize, menu: false });

  /// Show left side menu
  const toggleMenu = () => setUI({
    ...ui,
    menu: !ui.menu,
    selected: ui.menu ? ui.selected : '',
    sidebarSize: ui.menu ? ui.sidebarSize : 0
  });

  /// Close left side menu if clicked
  const handleMapClick = () =>
    ui.menu && setUI({ ...ui, menu: false });

  const counter = [state.participantCount, state.meetupCount, state.attestationCount][currentPhase.phase];

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
          participantCount={ui.selected ? (state.participants[ui.selected] || 0) : 0}
          lastParticipantCount={ui.selected ? state.lastCeremony.participants[ui.selected] : 0}
          meetupCount={ui.selected ? (state.meetups[ui.selected] || 0) : 0}
          lastMeetupCount={ui.selected ? state.lastCeremony.meetups[ui.selected] : 0}
          debug={debug}
        />

        <Sidebar.Pusher className='encointer-map-wrapper'
          style={{ marginRight: ui.portrait ? '0' : ui.sidebarSize + 'px' }}>

          <MapCeremonyPhases
            small={ui.portrait} counter={counter} currentPhase={currentPhase} />

          <MapNodeInfo
            style={ui.portrait && ui.selected ? { display: 'none' } : {}} />

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
                state={state}
                onClick={handleCurrencyMarkerClick}
                selected={ui.selected} />
              : null }

          </LMap>

        </Sidebar.Pusher>

      </Sidebar.Pushable>

      { debug
        ? <DeveloperConsole />
        : null }

    </Responsive>
  );
}
