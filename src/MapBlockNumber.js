import React, { useEffect, useState } from 'react';
import { Statistic, Card } from 'semantic-ui-react';

import { useSubstrate } from './substrate-lib';

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

function MapBlockNumberMain (props) {
  return (
    <Card className='encointer-map-block-number'>
      <Card.Content>
        <BlockNumber finalized={true} />
        <BlockNumber />
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
