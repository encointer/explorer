import React, { useReducer, useEffect } from 'react';
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
    case 'activate':
      return ((state, action) => {
        const { count, timeout, attest } = action.payload;
        return { ...state, active: true, count, timeout, attest };
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
  const { meetupCount, participantCount, phase, attestationCount: attest } = props;
  const { coords } = props.data;
  const [state, dispatch] = useReducer(reducer, { active: false, count: 0 });

  const count = phase === 0 ? participantCount : meetupCount;
  useEffect(() => {
    if (state.count !== count || state.attest !== attest) {
      const timeout = setTimeout(() => {
        dispatch({ type: 'deactivate' });
      }, pulseTimer);
      dispatch({ type: 'active', count, timeout, attest });
    }
  }, [state, count, attest]);
  if (!coords || !coords.length) {
    return null;
  }
  const active = state.active;
  return (<MarkerClusterGroup iconCreateFunction={createClusterCustomIcon}>{
    coords.map((pos, idx) => (
      <Marker
        position={pos}
        key={''.concat(idx, count, attest, active ? 'force-redraw' : '')}
        phase={phase}
        count={count}
        attest={state.attest}
        icon={locationMarker} />))
  }</MarkerClusterGroup>);
}
