import React, { useEffect, useState, useRef, useReducer } from 'react';
import { Map as LMap, TileLayer } from 'react-leaflet';
// todo #54
// import { createMedia } from '@artsy/fresnel';
import { Sidebar, Segment } from 'semantic-ui-react';

import * as L from 'leaflet';
import { u32 as U32 } from '@polkadot/types/primitive';
import { u8aToString } from '@polkadot/util';

import { useSubstrate } from './substrate-lib';
import { DeveloperConsole } from './substrate-lib/components';

import MapMenu from './map/MapMenu';
import MapCeremonyPhases from './map/MapCeremonyPhases';
import MapNodeInfo from './map/MapNodeInfo';
import MapControl from './map/MapControl';
import MapSidebar from './map/MapSidebar';
import MapNodeSwitchWidget from './map/MapNodeSwitchWidget';

import { CommunitiesClusters } from './map/CommunitiesClusters';
import { LocationsLayer } from './map/LocationsLayer';
import { parseI64F64, batchFetch } from './utils';

import 'leaflet/dist/leaflet.css';
import 'react-leaflet-markercluster/dist/styles.min.css';

import { communityIdentifierToString } from '@encointer/util/cidUtil';
// todo #54
// const AppMedia = createMedia({
//   breakpoints: {
//     mobile: 320,
//     tablet: 768,
//     computer: 992,
//     largeScreen: 1200,
//     widescreen: 1920
//   }
// });
//
// const mediaStyles = AppMedia.createMediaStyle();
// const { Media, MediaContextProvider } = AppMedia;

const initialPosition = L.latLng(47.166168, 8.515495);

const BLOCKS_PER_MONTH = (86400 / 6) * (365 / 12);

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

// used to sumup all participants (bootstrappers, newbies, etc.) in the assignmentCount json
const sumValues = obj => Object.values(obj).reduce((a, b) => a + b);

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
// THIS USE-CASES trigger the action to save to the state calles 'state' , which is done by the setter 'dispatch'
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
        const participantCount = action.payload.count;
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
  const { api, apiState, socket } = useSubstrate();

  const [ui, setUI] = useState({ selected: '', loading: true, menu: false, nodeSwitch: false });
  const [cids, setCids] = useState([]);
  const [hash, setHash] = useState([]);
  const [data, setData] = useState({});
  const [position, setPosition] = useState(initialPosition);
  const [currentPhase, setCurrentPhase] = useState({ phase: -1, timestamp: 0, timer: null });
  const [ceremonyIndex, setCeremonyIndex] = useState(0);
  const [state, dispatch] = useReducer(reducer, initialState);

  const ec = api && api.query && api.query.encointerCommunities;
  const ec_ = api && api.rpc && api.rpc.communities;

  /// Fetch locations for each Community in parallel; Save to state once ready
  async function fetchGeodataPar (cids, hash) { /* eslint-disable no-multi-spaces */
    const kvReducer = (acc, data, idx) => { // convert array to key-value map
      acc[hash[idx]] = data;                // where key is BASE58 of cid
      return acc;
    };

    debug && console.log('FETCHING LOCATIONS AND PROPERTIES');
    const fetcher = ec.communityMetadata;
    const [locations, properties] = await Promise.all([
      await batchFetch(         // Fetching all Locations in parallel
        ec_.getLocations,           // API: encointerCommunities.locations(cid) -> Vec<Location>
        cids // convert Location from I32F32 to LatLng
      ),                        // Fetching all community Properties
      await batchFetch(fetcher, cids)]);
    debug && console.log('SETTING DATA', locations, properties);

    setData(cids.map((cid, idx) => ({ // Shape of data in UI
      cid,                            // cid for back-reference
      coords: locations[idx],         // all coords
      position: L.latLngBounds(locations[idx]).getCenter(),
      demurrage: properties[idx].demurrage_per_block ? parseDemurrage(properties[idx].demurrage_per_block) : 1,
      demurragePerBlock: properties[idx].demurrage_per_block ? parseI64F64(properties[idx].demurrage_per_block) : 0,
      name: properties[idx].name_utf8 ? u8aToString(properties[idx].name_utf8) : properties[idx].name
    })).reduce(kvReducer, {}));
    setUI({ ...ui, loading: false });
  }

  /// Update current phase
  useEffect(() => {
    let unsub;
    debug && console.log('phase', currentPhase.phase);
    if (!apiReady(api, 'encointerScheduler')) {
      return;
    }

    const {
      encointerScheduler: {
        currentPhase: getCurrentPhase,
        nextPhaseTimestamp: getNextPhaseTimestamp
      }
    } = api.query;

    getCurrentPhase(newPhase => {
      const phase = newPhase.toNumber();
      if (currentPhase.phase !== phase) {
        getNextPhaseTimestamp()
          .then(newPhaseTimestamp => {
            const timestamp = newPhaseTimestamp.toNumber();
            setCurrentPhase({ phase, timestamp });
          })
          .catch(console.error);
      }
    }).then((unsubscribe) => {
      unsub = unsubscribe;
    });
    return () => {
      unsub && unsub();
    };
  }, [currentPhase.phase, debug, ec, api]);

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
    // debug && console.log('ceremony id', currentPhase.phase, ceremonyIndex);
    const CommunityCeremony = api.registry.getOrUnknown('CommunityCeremony');

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
          assignmentCounts: getAssignmentCount,
          meetupCount: getMeetupCount
        }
      } = api.query;
      // Previous Phases of current Ceremony
      for (let oldPhase = 0; oldPhase < phase; oldPhase++) {
        cids.forEach(cid => {
          const communityCeremony = new CommunityCeremony(api.registry, [cid, ceremony]);
          const getters = [getAssignmentCount, getMeetupCount];
          const getter = getters[oldPhase];
          debug && console.log('hist ', cid, ceremony.toNumber(), 'oldphase', oldPhase);
          if (oldPhase === 0) {
            getter(communityCeremony).then((_) => dispatch({
              type: setters[oldPhase],
              payload: {
                cid: communityIdentifierToString(cid),
                count: sumUp(_.toJSON())
              }
            }));
          } else {
            getter(communityCeremony).then((_) => dispatch({
              type: setters[oldPhase],
              payload: {
                cid: communityIdentifierToString(cid),
                count: _.toNumber()
              }
            }));
          }
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
          assignmentCounts: getAssignmentCount,
          meetupCount: getMeetupCount
        }
      } = api.query;
      // Last Ceremony
      const lastCeremony = ceremony.sub(new U32(api.registry, 1));
      const lastCeremonyData = await Promise.all(cids.map(cid => {
        const communityCeremony = new CommunityCeremony(api.registry, [cid, lastCeremony]);
        return api.queryMulti([
          [getAssignmentCount, communityCeremony],
          [getMeetupCount, communityCeremony]
        ]);
      }));
      const payload = lastCeremonyData.reduce((acc, data, idx) => {
        const cid = cids[idx];
        const cidComplete = communityIdentifierToString(cid);
        const [assignmentCount, meetupCount] = data;
        acc.meetups[cidComplete] = meetupCount.toNumber();
        const sumOfAssignments = sumValues(assignmentCount.toJSON());
        acc.participants[cidComplete] = sumOfAssignments;
        acc.assignmentCount = acc.participants[cidComplete] + acc.assignmentCount;
        acc.meetupCount = acc.meetups[cidComplete] + acc.meetupCount;
        return acc;
      }, {
        subscribtionCeremony: lastCeremony.toNumber(),
        meetups: {},
        participants: {},
        assignmentCount: 0,
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
          assignmentCounts: getAssignmentCount,
          attestationCount: getAttestationCount,
          meetupCount: getMeetupCount
        }
      } = api.query;
      const getters = [getAssignmentCount, getMeetupCount, getAttestationCount];
      const CommunityCeremony = api.registry.getOrUnknown('CommunityCeremony');
      const unsubs = await Promise.all(cids.map(cid => {
        const communityCeremony = new CommunityCeremony(api.registry, [cid, ceremonyIndex]);
        const getter = getters[phase];
        if (phase === 0) {
          return getter(communityCeremony, (_) => dispatch({
            type: setters[phase],
            payload: {
              cid: communityIdentifierToString(cid),
              count: sumUp(_.toJSON())
            }
          }));
        }
        return getter(communityCeremony, (_) => dispatch({
          type: setters[phase],
          payload: {
            cid: communityIdentifierToString(cid),
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
        // debug && console.log('set ceremonyIndex', currentCeremonyIndex.toString());
        setCeremonyIndex(currentCeremonyIndex);
      });
    } else if (currentPhase.phase !== -1 &&
        (currentPhase.phase !== state.subscribtionPhase ||
         ceremonyIndex.toNumber() !== state.subscribtionCeremony) &&
        cids.length) {
      subscribeToUpdates(ceremonyIndex, currentPhase.phase, cids);
      fetchHistoricData(ceremonyIndex, currentPhase.phase, cids);
      !state.lastCeremony.subscribtionCeremony && fetchLastCeremony(ceremonyIndex, cids);
    }
    if (currentPhase.phase === ceremonyPhases.REGISTERING) {
      state.subscribtionCeremony !== state.lastCeremony.subscribtionCeremony &&
        dispatch({ type: 'reset' }); // reset state on start of new ceremony
      getCurrentCeremonyIndex().then((currentCeremonyIndex) => {
        // debug && console.log('set ceremonyIndex', currentCeremonyIndex.toString());
        setCeremonyIndex(currentCeremonyIndex);
      });
    }
  }, [currentPhase.phase, ceremonyIndex]);

  // OPTIONAL FOR DEBUGGING, FINDING OUT HOW THE PARTICULAR PROPERTIES OF THE STATE CHANGE
  // useEffect(() => console.log('state participants are: ' + JSON.stringify(state.participants)), [state]);
  // useEffect(() => console.log('state participantCount are: ' + JSON.stringify(state.participantCount)), [state]);
  // useEffect(() => console.log('state meetups are: ' + JSON.stringify(state.meetups)), [state]);
  // useEffect(() => console.log('state lastCeremony participants are: ' + JSON.stringify(state.lastCeremony.participants)), [state]);
  // useEffect(() => console.log('state lastCeremony meetups are: ' + JSON.stringify(state.lastCeremony.meetups)), [state]);
  // useEffect(() => console.log('ui.selected: ' + JSON.stringify(ui.selected)), [ui.selected]);

  /// Load communities identifiers once
  useEffect(() => {
    // debug && console.log('cids', cids);

    if (ec && cids.length === 0) {
      const getter = ec.communityIdentifiers;
      getter().then(cids => {
        const hashes = cids.map(communityIdentifierToString);
        setCids(cids);
        setHash(hashes);
      })
        .catch(err => console.error(err));
    }
  }, [cids, debug, ec]);

  /// Get locations effect
  useEffect(() => { /* eslint-disable react-hooks/exhaustive-deps */
    // debug && console.log('get locations');
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

  /// Handler for click on Community marker
  const handleCommunityMarkerClick = cid => {
    const map = mapRef.current.leafletElement;
    setUI({ ...ui, selected: cid, prevZoom: map.getZoom() });
    const bounds = L.latLngBounds(data[cid].coords).pad(2);
    map.fitBounds(bounds);
  };

  // todo: fix the responsive part, which I think is still not doing anything in the productive part, or does it? #54, the responsive component has been removed, look in previous commits, how it used to be.
  /// Handler for window resize
  // const handleResponsibleUpdate = (_, { width }) =>
  //   setUI({ ...ui, portrait: width < Responsive.onlyMobile.maxWidth, width });

  /// Handler for sidebar closing
  const handleSidebarClosed = () => {
    const map = mapRef.current.leafletElement;
    map.setZoom(ui.prevZoom);
    setUI({ ...ui, selected: '', sidebarSize: 0 });
  };

  /// Handler for sidebar shows completely
  const handleSidebarShow = sidebarSize =>
    setUI({ ...ui, sidebarSize, menu: false, nodeSwitch: false });

  /// Show left side menu
  const toggleMenu = () => setUI({
    ...ui,
    menu: !ui.menu,
    selected: ui.menu ? ui.selected : '',
    sidebarSize: ui.menu ? ui.sidebarSize : 0
  });

  /// Close left side menu if clicked
  const handleMapClick = () =>
    ui.menu && setUI({ ...ui, menu: false, nodeSwitch: false });

  /// Open node switch widget
  const handleClickNode = () =>
    !ui.nodeSwitch && setUI({ ...ui, nodeSwitch: true });
  const handleNodeSwitchClose = () => setUI({ ...ui, nodeSwitch: false });

  return (
      <div className='encointer-map'>
        <Sidebar.Pushable as={Segment}  className='component-wrapper'>

          <MapMenu visible={ui.menu} />

          <MapNodeSwitchWidget
              socket={socket}
              visible={ui.nodeSwitch}
              onClose={handleNodeSwitchClose}
          />

          <MapSidebar
              api={api}
              apiState={apiState}
              onClose={handleSidebarClosed}
              onShow={handleSidebarShow}
              hash={ui.selected}
              direction={ui.portrait ? 'bottom' : 'right'}
              width='very wide'
              data={data[ui.selected] || {}}
              participantCount={ui.selected ? (state.participants[ui.selected] || 0) : 0}
              lastParticipantCount={ui.selected ? (state.lastCeremony.participants[ui.selected] || 0) : 0}
              meetupCount={ui.selected ? (state.meetups[ui.selected] || 0) : 0}
              lastMeetupCount={ui.selected ? (state.lastCeremony.meetups[ui.selected] || 0) : 0}
              debug={debug}
          />

          <Sidebar.Pusher className='encointer-map-wrapper'
                          style={{ marginRight: ui.portrait ? '0' : ui.sidebarSize + 'px' }}>

            <MapCeremonyPhases
                small={ui.portrait}
                participantCount={state.participantCount}
                meetupCount={state.meetupCount}
                attestationCount={state.attestationCount}
                currentPhase={currentPhase} />

            <MapNodeInfo
                api={api}
                apiState={apiState}
                onClickNode={handleClickNode}
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
                ? <LocationsLayer
                      participantCount={ui.selected ? (state.participants[ui.selected] || 0) : 0}
                      meetupCount={ui.selected ? (state.meetups[ui.selected] || 0) : 0}
                      attestationCount={ui.selected ? (state.attestations[ui.selected] || 0) : 0}
                      phase={currentPhase.phase}
                      data={data[ui.selected]}
                  />
                : null }

              { !ui.loading
                ? <CommunitiesClusters
                      data={data}
                      cids={hash}
                      state={state}
                      onClick={handleCommunityMarkerClick}
                      selected={ui.selected} />
                : null }
            </LMap>

          </Sidebar.Pusher>

        </Sidebar.Pushable>

        { (debug && apiState === 'READY')
          ? <DeveloperConsole />
          : null }
      </div>
  );
}
