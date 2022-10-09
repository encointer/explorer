import React, { useState, useEffect } from 'react';
import { Step, Label } from 'semantic-ui-react';
import { CeremonyPhaseTimer } from './CeremonyPhaseTimer';
import { getNextMeetupTime } from '@encointer/node-api';
import { stringToDegree } from '@encointer/types';
import { bnToU8a } from '@polkadot/util';

const ceremonyPhases = [
  'REGISTERING',
  'ASSIGNING',
  'ATTESTING'
];

const formatDate = (timestamp) => (new Date(timestamp)).toLocaleString();

const formatStartingAt = (timestamp) => (<div><div>starting at:</div> {formatDate(timestamp)}</div>);

/**
 * Parses a location json with fields as number strings to a `Location` object.
 *
 * There is a rust vs. JS endian issue with numbers: https://github.com/polkadot-js/api/issues/4313.
 *
 * tl;dr: If the returned location is processed:
 *  * by a node (rust), use isLe = false.
 *  * by JS, e.g. `parseDegree`, use isLe = true.
 *
 *
 * @param api
 * @param location fields as strings, e.g. '35.2313515312'
 * @param isLe
 * @returns {Location} Location with fields as fixed-point numbers
 */
export function locationFromJson (api, location, isLe = true) {
  return api.createType('Location', {
    lat: bnToU8a(stringToDegree(location.lat), 128, isLe),
    lon: bnToU8a(stringToDegree(location.lon), 128, isLe)
  });
}

export default React.memo(function MapCeremonyPhases (props) {
  const {
    small,
    participantCount,
    meetupCount,
    attestationCount,
    api,
    cids,
    currentPhase: {
      phase: currentPhase,
      timestamp
    }
  } = props;

  const counter = [participantCount, meetupCount, attestationCount];

  const phasesSteps = phase => {
    const phasesProps = (currentPhase === -1 ? [] : ceremonyPhases)
      .map((phase, idx) => ({
        key: ceremonyPhases[idx],
        counter: counter[idx],
        active: (idx === currentPhase),
        className: 'step-'.concat(ceremonyPhases[idx]).toLowerCase()
      })).filter((prop, idx) =>
        !small || prop.active || idx === currentPhase + 1 || (idx === 0 && currentPhase === 2)
      );
    return (small && currentPhase === 2) ? phasesProps.reverse() : phasesProps;
  };

  const [nextMeetupTime, setNextMeetupTime] = useState([]);
  // gets the date of the next Meetup
  useEffect(() => {
    async function getNextMeetupDate () {
      const meetupLocations = await api.rpc.encointer.getLocations(cids[0]);
      const tempLocation = locationFromJson(api, meetupLocations[0]);
      const tempTime = await getNextMeetupTime(api, tempLocation);
      const tempdate = new Date(tempTime.toNumber());
      const temparray = (tempdate.toString()).split('G');
      const tempresultarray = temparray[0].split(' ');
      setNextMeetupTime(' ' + tempresultarray[0] + ' ' + tempresultarray[2] + ' ' + tempresultarray[1] + ' ' + tempresultarray[3]);
    }
    getNextMeetupDate();
  }, [api, nextMeetupTime, setNextMeetupTime, cids]);

  return (<div className='encointer-map-ceremony-phase'>
    <Step.Group
      ordered
      unstackable
      className={[
        ceremonyPhases[currentPhase],
        small ? 'small-screen' : ''
      ].join(' ')}
      size='mini'>{
        phasesSteps(currentPhase)
          .map((props, idx) => (
            <Step {...props}>
              <Step.Content>
                <Step.Title>
                  {props.key} {
                    (idx <= currentPhase && props.counter) ? <Label circular color={props.active ? 'green' : 'grey'}>{props.counter}</Label> : null
                  }</Step.Title>
                <Step.Description>{
                  (props.active)
                    ? <div><div>time left: </div><CeremonyPhaseTimer nextPhaseTimestamp={timestamp} /></div>
                    : (small
                        ? formatStartingAt(timestamp)
                        : ((idx === (currentPhase + 1) ||
                          (idx === 0 && currentPhase === 2))
                            ? formatStartingAt(timestamp)
                            : null))
                }</Step.Description>
                <Step.Description>
                  {
                    (props.key === 'ATTESTING')
                      ? <div>date of next ceremony: {nextMeetupTime}</div>
                      : null
                  }
                </Step.Description>
              </Step.Content>
            </Step>
          ))
      }</Step.Group>
  </div>);
}, (newProp, oldProp) => {
  return (oldProp.small === newProp.small &&
          oldProp.participantCount === newProp.participantCount &&
          oldProp.meetupCount === newProp.meetupCount &&
          oldProp.attestationCount === newProp.attestationCount &&
          oldProp.currentPhase.phase === newProp.currentPhase.phase &&
          oldProp.currentPhase.timestamp === newProp.currentPhase.timestamp);
});
