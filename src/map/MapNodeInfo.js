import React, { useEffect, useState } from 'react';
import { Card, Loader} from 'semantic-ui-react';

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
  return (currentCeremonyIndex
    ? <React.Fragment>
        <span>ceremony</span> <strong> #{currentCeremonyIndex}</strong>
      </React.Fragment>
    : null);
}, _ => true);

function MapNodeInfoMain (props) {
  const { apiState, api } = useSubstrate();
  const [nodeInfo, setNodeInfo] = useState({});
  const system = api && api.rpc && api.rpc.system;
  const getCurrentCeremonyIndex = api && api.query && api.query.encointerScheduler &&
        api.query.encointerScheduler.currentCeremonyIndex;

  useEffect(() => {
    if (system) {
      const getInfo = async () => {
        try {
          const [chain, nodeName, nodeVersion] = await Promise.all([
            system.chain(),
            system.name(),
            system.version()
          ]);
          setNodeInfo({ chain, nodeName, nodeVersion });
        } catch (e) {
          console.error(e);
        }
      };
      getInfo();
    }
  }, [system]);

  return (
    <Card className='encointer-map-node-info' style={props.style || {}}>{
      apiState === 'READY'
      ? <React.Fragment>
      <Card.Content>
        <Card.Header>{nodeInfo.nodeName}</Card.Header>
        <Card.Meta>{`${nodeInfo.chain || ''} v${nodeInfo.nodeVersion}`}</Card.Meta>
      </Card.Content>
      <Card.Content className='blocks'>
        {
          getCurrentCeremonyIndex
            ? <React.Fragment>
            <Card.Meta></Card.Meta>
            <div className='block-current'>current block #<Blocks /></div>
            <div className='finalized-current'>finalized block #<Blocks finalized /></div>
            <div className='ceremony'><CeremonyIndex /></div>
            </React.Fragment>
            : <React.Fragment>
                <div className='loading'>
                  <Loader active size='medium' inline='centered' />
                </div>
              </React.Fragment>
        }
      </Card.Content>
      </React.Fragment>
      : <Card.Content className='loading'>
        {
          apiState !== 'ERROR'
            ? <Card.Meta><Loader active size='small' inline /> Connecting to the blockchain</Card.Meta>
            : <Card.Meta>Error connecting to the blockchain</Card.Meta>
        }
      </Card.Content>
    }</Card>
    );
}

export default function MapNodeInfo (props) {
  return <MapNodeInfoMain {...props} />;
}
