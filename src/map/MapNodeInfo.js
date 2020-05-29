import React, { useEffect, useState } from 'react';
import { Card } from 'semantic-ui-react';

import { useSubstrate } from '../substrate-lib';

const Blocks = React.memo(props => {
  const { api } = useSubstrate();
  const [blockNumber, setBlockNumber] = useState(0);
  const bestNumber = props.finalized
    ? api.derive.chain.bestNumberFinalized
    : api.derive.chain.bestNumber;
  useEffect(() => {
    let unsubscribeAll;
    bestNumber(blockNumber => {
      setBlockNumber(blockNumber.toNumber());
    }).then(unsub => {
      unsubscribeAll = unsub;
    })
      .catch(console.error);
    return () => unsubscribeAll && unsubscribeAll();
  }, [bestNumber]);
  return <React.Fragment>{blockNumber}</React.Fragment>;
}, _ => true);

const CeremonyIndex = React.memo(props => {
  const {
    api: {
      query: {
        encointerScheduler: {
          currentCeremonyIndex: getCurrentCeremonyIndex
        }
      }
    }
  } = useSubstrate();
  const [currentCeremonyIndex, setCurrentCeremonyIndex] = useState(0);
  useEffect(() => {
    let unsubscribeAll;
    getCurrentCeremonyIndex(newCeremonyIndex => {
      setCurrentCeremonyIndex(newCeremonyIndex.toNumber());
    }).then(unsub => {
      unsubscribeAll = unsub;
    })
      .catch(console.error);
    return () => unsubscribeAll && unsubscribeAll();
  }, [getCurrentCeremonyIndex]);
  return currentCeremonyIndex ? <React.Fragment>{currentCeremonyIndex}</React.Fragment> : null;
}, _ => true);

function MapNodeInfoMain (props) {
  const { api } = useSubstrate();
  const [nodeInfo, setNodeInfo] = useState({});

  useEffect(() => {
    const getInfo = async () => {
      try {
        const [chain, nodeName, nodeVersion] = await Promise.all([
          api.rpc.system.chain(),
          api.rpc.system.name(),
          api.rpc.system.version()
        ]);
        setNodeInfo({ chain, nodeName, nodeVersion });
      } catch (e) {
        console.error(e);
      }
    };
    getInfo();
  }, [api.rpc.system]);

  return (nodeInfo.nodeName
    ? <Card className='encointer-map-node-info' style={props.style || {}}>
      <Card.Content>
        <Card.Header>{nodeInfo.nodeName}</Card.Header>
        <Card.Meta>{`${nodeInfo.chain || ''} v${nodeInfo.nodeVersion}`}</Card.Meta>
      </Card.Content>

      <Card.Content className='blocks'>
        <Card.Meta></Card.Meta>
        <div className='block-current'>current block #<Blocks /></div>
        <div className='finalized-current'>finalized block #<Blocks finalized /></div>
        <div className='ceremony'><span>ceremony</span> <strong> #<CeremonyIndex /></strong></div>
      </Card.Content>
    </Card>
    : null);
}

export default function MapNodeInfo (props) {
  const { api } = useSubstrate();
  return api.query &&
    api.query.encointerScheduler &&
    api.query.encointerScheduler.currentCeremonyIndex &&
    api.rpc &&
    api.rpc.system &&
    api.rpc.system.chain &&
    api.rpc.system.name &&
    api.rpc.system.version ? (
      <MapNodeInfoMain {...props} />
    ) : null;
}
