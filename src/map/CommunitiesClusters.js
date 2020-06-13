import React, { useEffect, useRef, useReducer } from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import * as L from 'leaflet';

const pulseTimer = 3000;
const DivIcon = L.divIcon;
const iconSize = [40, 40];

const iconActivePulse = new DivIcon({
  iconSize,
  className: 'encoiner-community-icon marker-cluster marker-cluster-small pulse',
  html: '<div><span>$</span></div>'
});
const iconActive = new DivIcon({
  iconSize,
  className: 'encoiner-community-icon marker-cluster marker-cluster-small',
  html: '<div><span>$</span></div>'
});
const iconSemiactive = new DivIcon({
  iconSize,
  className: 'encoiner-community-icon marker-cluster marker-cluster-small yellow',
  html: '<div><span>$</span></div>'
});

const iconInactive = new DivIcon({
  iconSize,
  className: 'encoiner-community-icon marker-cluster marker-cluster-small red',
  html: '<div><span>$</span></div>'
});
const selectedIcon = new DivIcon({
  iconSize: [2, 2],
  className: '',
  html: ''
});

const iconSet = {
  'green pulse': iconActivePulse,
  green: iconActive,
  yellow: iconSemiactive,
  red: iconInactive
};

const getClusterIcon = (phase, count, active) => {
  if (active) { // animated icon
    return 'green pulse';
  } else if (phase === 0) { // in REGISTERING phase
    return count ? 'green' : 'yellow'; // green if >0 registered
  } else if (count !== 0) {
    return count > 1 ? 'green' : 'yellow'; // if 1 meetup then yellow, if >1 green
  } else {
    return 'red'; // in ASSIGNING and ATTESTING if 0 meetups
  }
};

const getIcon = (phase, count, active) => {
  const iconClass = getClusterIcon(phase, count, active);
  return iconSet[iconClass];
};

const createClusterCustomIcon = function (cluster) {
  const markers = cluster.getAllChildMarkers();
  const phase = markers[0].options.phase;
  const count = markers
    .map(it => it.options.count)
    .reduce((acc, it) => it > acc ? it : acc, 0);
  const active = markers
    .map(it => it.options.active)
    .reduce((acc, it) => it || acc, false);

  const iconClass = getClusterIcon(phase, count, active);
  const markerCount = cluster.getChildCount();
  return L.divIcon({
    html: ''.concat('<div><span>', markerCount, '</span></div>'),
    className: 'marker-cluster marker-cluster-small encoiner-cluster-custom '.concat(iconClass),
    iconSize: L.point(40, 40, true)
  });
};

const initialState = {
  timers: {},
  byCID: {},
  phase: -1
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'initialize':
      return ((state, action) => {
        const { phase, byCID } = action.payload;
        return { ...state, byCID, phase };
      })(state, action);

    case 'phase':
      return { ...state, phase: action.payload };

    case 'reset':
      return ((state, action) => {
        const { phase, byCID } = action.payload;
        const markers = { ...state.byCID };
        for (const cid in markers) {
          markers[cid].count = byCID[cid] || 0;
        }
        return { ...state, byCID: markers, phase };
      })(state, action);

    case 'activate':
      return ((state, action) => {
        const { payload } = action;
        const { timers } = payload;
        const byCID = { ...state.byCID, ...payload.byCID };
        for (const tid in timers) {
          state.timers[tid] && clearTimeout(state.timers[tid]);
        }
        return { ...state, byCID, timers: { ...state.timers, ...timers } };
      })(state, action);

    case 'deactivate':
      return ((state, action) => {
        const cid = action.payload;
        const byCID = { ...state.byCID };
        const timers = { ...state.timers };
        byCID[cid] = { ...byCID[cid], active: false };
        clearTimeout(timers[cid]);
        timers[cid] = 0;
        return { ...state, byCID, timers };
      })(state, action);
    default:
      return state;
  }
};

/// communities markers layer with clusterisation
export function CommunitiesClusters (props) {
  const { cids, data, selected, state } = props;
  const [markers, dispatch] = useReducer(reducer, initialState);
  const ref = useRef(null);
  const handleMarkerClick = _ => _.sourceTarget.options.alt && props.onClick(_.sourceTarget.options.alt);
  const phase = state.subscribtionPhase;
  const counters = state[['participants', 'meetups', 'meetups'][phase]]; // counter for each phase is meetups
  const attestations = state.attestations; // counter for ATTESTING phase is meetups
  const byCID = markers.byCID;

  /// Init markers
  if (markers.phase === -1 && phase !== -1) {
    const byCID = cids.map((cid, idx) => {
      const { gps, name } = data[cid];
      const meetups = state.meetups[cid] || 0;
      const count = phase ? meetups : (counters[cid] || 0);
      const attests = phase === 2 ? (attestations[cid] || 0) : 0;
      return {
        name,
        key: cid,
        position: gps,
        active: false,
        count,
        attests
      };
    }).reduce((acc, marker) => {
      acc[marker.key] = marker;
      return acc;
    }, {});
    dispatch({ type: 'initialize', payload: { byCID, phase } });
  } else if (phase > markers.phase || (phase === 0 && markers.phase === 2)) {
    /// Reset counters
    dispatch({ type: 'reset', payload: { byCID: counters, phase } });
  }

  /// Update counters
  useEffect(() => { /* eslint-disable react-hooks/exhaustive-deps */
    const newMarkers = {};
    const timers = {};
    cids.forEach((cid) => {
      const counter = counters ? (counters[cid] || 0) : 0;
      const attests = attestations ? attestations[cid] : 0;
      if (markers.byCID[cid].count < counter ||
          markers.byCID[cid].attests < attests) {
        newMarkers[cid] = markers.byCID[cid];
        newMarkers[cid].count = counter;
        newMarkers[cid].attests = attestations[cid];
        newMarkers[cid].active = true;
        timers[cid] = setTimeout(() => {
          dispatch({ type: 'deactivate', payload: cid });
        }, pulseTimer);
      }
    });
    dispatch({ type: 'activate', payload: { byCID: newMarkers, timers } });
  }, [counters, attestations, cids]);

  // Update clusters
  useEffect(() => {
    let tid;
    const active = [];
    for (const cid in markers.byCID) {
      if (markers.byCID[cid].active) {
        active.push(cid);
      }
    }
    if (active.length) {
      tid = setTimeout(() => { // redraw clusters
        if (ref.current !== null && ref.current.leafletElement) {
          ref.current.leafletElement.refreshClusters();
        }
      }, 10);
    }

    return () => {
      tid && clearTimeout(tid);
    };
  }, [byCID]);

  return (
    <MarkerClusterGroup ref={ref} onClick={handleMarkerClick}
      iconCreateFunction={createClusterCustomIcon}
      chunkedLoading={true}
    >{
        Object.keys(byCID).map(cid => {
          const { key, position, name, active, count, attests } = byCID[cid];
          const isSelected = selected === cid;
          return (<Marker
            key={key.concat(phase, attests, count, active ? 'force-redraw' : '')}
            position={position}
            alt={cid}
            count={count}
            active={active}
            phase={phase}
            attests={attests}
            icon={
              isSelected
                ? selectedIcon
                : getIcon(markers.phase, count, active)
            }>{
              !isSelected
                ? <Tooltip direction='top' offset={[0, iconSize[1] / -2]}>{name}</Tooltip>
                : null
            }</Marker>);
        })
      }</MarkerClusterGroup>);
}
