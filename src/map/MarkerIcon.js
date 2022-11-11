import * as L from 'leaflet';

const DivIcon = L.divIcon;

const commonClassName = 'marker-cluster marker-cluster-small ';
const markerClassName = commonClassName.concat('encoiner-community-icon');
const clusterClassName = commonClassName.concat('encoiner-cluster-custom');

const iconSize = [40, 40];

export const icon = (className, count) => new DivIcon({
  iconSize,
  className: ''.concat(className),
  html: '<div><span>'.concat(count, '</span></div>')
});

export const communityIcon = (className) => icon(markerClassName.concat(' ', className), '$');

export const clusterIcon = (className, count) => icon(clusterClassName.concat(' ', className), count);

export const iconActive = communityIcon('');

export const iconActivePulse = communityIcon('pulse');

export const iconSemiactivePulse = communityIcon('yellow pulse');

export const iconSemiactive = communityIcon('yellow');

export const iconInactive = communityIcon('red');

export const locationMarker = new L.Icon({
  iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export const getClusterIcon = (phase, count, active) => {
  let className;
  if (phase === 0) { // in REGISTERING phase
    className = count ? 'green' : 'yellow'; // green if >0 registered
  } else {
    className = count >= 1 ? 'green' : 'red'; // if 0 meetup then red, if >=1 green
  } 
  if (active) { // animated icon
    return className.concat(' pulse');
  } else {
    return className;
  }
};
