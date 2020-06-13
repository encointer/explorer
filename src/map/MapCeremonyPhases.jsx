import React from 'react';
import { Step, Label } from 'semantic-ui-react';
import { CeremonyPhaseTimer } from './CeremonyPhaseTimer';

const ceremonyPhases = [
  'REGISTERING',
  'ASSIGNING',
  'ATTESTING'
];

const formatDate = (timestamp) => (new Date(timestamp)).toLocaleString();

const formatStartingAt = (timestamp) => (<div><div>starting at:</div> {formatDate(timestamp)}</div>);

export default React.memo(function MapCeremonyPhases (props) {
  const {
    small,
    counter,
    currentPhase: {
      phase: currentPhase,
      timestamp
    }
  } = props;

  const phasesSteps = phase => {
    const phasesProps = (currentPhase === -1 ? [] : ceremonyPhases)
      .map((phase, idx) => ({
        key: ceremonyPhases[idx],
        active: (idx === currentPhase),
        className: 'step-'.concat(ceremonyPhases[idx]).toLowerCase()
      })).filter((prop, idx) =>
        !small || prop.active || idx === currentPhase + 1 || (idx === 0 && currentPhase === 2)
      );
    return (small && currentPhase === 2) ? phasesProps.reverse() : phasesProps;
  };

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
                    props.active ? (counter ? <Label circular color='green'>{counter}</Label> : null) : null
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
              </Step.Content>
            </Step>
          ))
      }</Step.Group>
  </div>);
}, (newProp, oldProp) => {
  return (oldProp.small === newProp.small &&
          oldProp.counter === newProp.counter &&
          oldProp.currentPhase.phase === newProp.currentPhase.phase &&
          oldProp.currentPhase.timestamp === newProp.currentPhase.timestamp);
});
