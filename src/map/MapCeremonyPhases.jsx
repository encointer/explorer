import React, { useState, useEffect } from 'react';
import { Step, Label } from 'semantic-ui-react';
import { CeremonyPhaseTimer } from './CeremonyPhaseTimer';
import { getStartOfAttestingPhase } from '@encointer/node-api';

const ceremonyPhases = [
  'REGISTERING',
  'ASSIGNING',
  'ATTESTING'
];

const formatDateTime = (timestamp) => (new Date(timestamp)).toLocaleString();

const formatDate = (timestamp) => (new Date(timestamp)).toLocaleDateString();

const formatStartingAt = (timestamp) => (<div><div>starting at:</div> {formatDateTime(timestamp)}</div>);

export default React.memo(function MapCeremonyPhases (props) {
  const {
    small,
    participantCount,
    meetupCount,
    attestationCount,
    api,
    cids,
    debug,
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

  const apiReady = (api, queryName = '') => {
    const query = api && api.queryMulti && api.query;
    return query && queryName ? (!!query[queryName]) : !!query;
  };

  const [nextMeetupTime, setNextMeetupTime] = useState([]);
  // gets the date of the next Meetup
  useEffect(() => {
    if (!apiReady(api, 'encointerScheduler')) {
      return;
    }
    async function getNextMeetupDate () {
      const startOfAttestingPhase = await getStartOfAttestingPhase(api);
      const date = formatDate(startOfAttestingPhase.toNumber());
      debug && console.log('startOfAttestingPhase: ' + date);
      setNextMeetupTime([date]);
    }
    getNextMeetupDate();
  }, [api, cids, debug]);

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
                <Step.Description>
                  {
                    (props.key === ceremonyPhases[2])
                      ? <div>Next ceremony: {nextMeetupTime}</div>
                      : null
                  }
                </Step.Description>
                <Step.Description>{
                  (props.active)
                    ? <div><div>Time left: </div><CeremonyPhaseTimer nextPhaseTimestamp={timestamp} /></div>
                    : (small
                        ? formatStartingAt(timestamp)
                        : ((idx === (currentPhase + 1) ||
                          (idx === 0 && currentPhase === 2))
                            ? formatStartingAt(timestamp)
                            : null))
                }</Step.Description>
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
