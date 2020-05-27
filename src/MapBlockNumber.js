import React, { useEffect, useState } from 'react';
import { Statistic, Card } from 'semantic-ui-react';
import { Step } from 'semantic-ui-react'

import { useSubstrate } from './substrate-lib';

const ceremonyPhases = [
  'REGISTERING',
  'ASSIGNING',
  'ATTESTING'
];

function BlockNumber (props) {
  const { api } = useSubstrate();
  const { finalized } = props;
  const [blockNumber, setBlockNumber] = useState(0);

  const bestNumber = finalized
    ? api.derive.chain.bestNumberFinalized
    : api.derive.chain.bestNumber;

  useEffect(() => {
    let unsubscribeAll = null;

    bestNumber(number => {
      setBlockNumber(number.toNumber());
    })
      .then(unsub => {
        unsubscribeAll = unsub;
      })
      .catch(console.error);

    return () => unsubscribeAll && unsubscribeAll();
  }, [bestNumber]);

  return (
    <Statistic size='small'
      label={(finalized ? 'Finalized' : 'Current') + ' Block'}
      value={blockNumber}
    />
  );
}

function CeremonyPhaseBox () {
  const { api: { query: { encointerScheduler: {
    currentCeremonyIndex: getCurrentCeremonyIndex,
    currentPhase: getCurrentPhase,
    nextPhaseTimestamp: getNextPhaseTimestamp } } } } = useSubstrate();
  const [ currentCeremonyIndex, setCurrentCeremonyIndex ] = useState(0);
  const [ nextPhaseTimestamp, setNextPhaseTimestamp ] = useState(0);
  const [ currentPhase, setCurrentPhase ] = useState(-1);

  useEffect(() => {
    let unsubscribeAll = null;

    api.queryMulti([
      getCurrentCeremonyIndex,
      getCurrentPhase,
      getNextPhaseTimestamp
    ], ([newCeremonyIndex, newPhase, newPhaseTimestamp]) => {
      setCurrentCeremonyIndex(newCeremonyIndex.toNumber());
      setCurrentPhase(newPhase.toNumber());
      setNextPhaseTimestamp(newPhaseTimestamp.toNumber());
    })
      .then(unsub => {
        unsubscribeAll = unsub;
      })
      .catch(console.error);

    return () => unsubscribeAll && unsubscribeAll();
  }, [getCurrentCeremonyIndex, getCurrentPhase, getNextPhaseTimestamp]);

  return (
    <Step.Group ordered size='mini'>{
        ceremonyPhases.map( (phase, idx) => ({
          key: ceremonyPhases[idx],
          completed: (idx < currentPhase),
          active: (idx === currentPhase),
          disabled: (idx > currentPhase)
        })).map( (props, idx) => (
            <Step {...props}>
              <Step.Content>
                <Step.Title>{props.key}</Step.Title>
                <Step.Description>
                  {
                    (currentPhase+1 === idx || (idx === 0 && currentPhase === 2))
                      ? (new Date(nextPhaseTimestamp)).toLocaleString()
                      : null
                  }
                </Step.Description>
              </Step.Content>
            </Step>
          ))
    }</Step.Group>
  );
}

function MapBlockNumberMain (props) {
  return (
    <Card className='encointer-map-block-number'>
      <Card.Content>
      <CeremonyPhaseBox />
      </Card.Content>
    </Card>
  );
}

export default function MapBlockNumber (props) {
  const { api } = useSubstrate();
  return api.derive &&
    api.derive.chain &&
    api.derive.chain.bestNumber &&
    api.derive.chain.bestNumberFinalized ? (
      <MapBlockNumberMain {...props} />
    ) : null;
}
