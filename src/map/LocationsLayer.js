import React, { useReducer, useEffect, useRef } from 'react';
import { Marker } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';

import { locationMarker, clusterIcon, getClusterIcon } from './MarkerIcon';

const pulseTimer = 3000;

const createClusterCustomIcon = function (cluster) {
  const markers = cluster.getAllChildMarkers();
  const phase = markers[0].options.phase;
  const count = markers[0].options.count;
  const active = markers[0].options.active;
  const markerCount = markers.length;
  return clusterIcon(getClusterIcon(phase, count, active), markerCount);
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'reset':
      return { active: false, count: 0, attest: 0, timeout: state.timeout };
    case 'activate':
      return ((state, action) => {
        const { count, timeout, attest } = action.payload;
        return { ...state, active: true, count, attest, timeout };
      })(state, action);
    case 'deactivate':
      return ((state, action) => {
        clearTimeout(state.timeout);
        return { ...state, active: false };
      })(state, action);
    default:
      return state;
  }
};

/// Markers layer
export function LocationsLayer (props) {
  const { phase, meetupCount, participantCount, attestationCount: attest } = props;
  const { coords } = props.data;
  const ref = useRef(null);
  const count = phase === 0 ? participantCount : meetupCount;
  const [state, dispatch] = useReducer(reducer, { active: false, count, attest });

  const active = state.active;

  /// Trigger active
  useEffect(() => {
    if (count === 0 && phase === 0 && (state.attest > 0 || state.count > 0)) {
      dispatch({ type: 'reset' });
      return;
    }
    if (state.count < count || state.attest < attest) {
      const timeout = setTimeout(() => {
        dispatch({ type: 'deactivate' });
      }, pulseTimer);
      dispatch({ type: 'activate', payload: { count, timeout, attest } });
    }
  }, [state, count, attest, phase]);

  // Update clusters
  useEffect(() => {
    let tid;
    if (active) {
      tid = setTimeout(() => { // redraw clusters
        if (ref.current !== null && ref.current.leafletElement) {
          ref.current.leafletElement.refreshClusters();
        }
      }, 10);
    }

    return () => {
      tid && clearTimeout(tid);
    };
  }, [active]);

  if (!coords || !coords.length) {
    return null;
  }

  return (<MarkerClusterGroup ref={ref} iconCreateFunction={createClusterCustomIcon}>{
    coords.map((pos, idx) => (
      <Marker
        position={pos}
        key={''.concat(idx, count, attest, active ? 'force-redraw' : '')}
        phase={phase}
        count={count}
        attest={state.attest}
        active={active}
        icon={locationMarker} />))
  }</MarkerClusterGroup>);
}
