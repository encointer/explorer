import React, { useEffect, useState } from 'react';
import { Card, Loader, Icon } from 'semantic-ui-react';

const Blocks = React.memo(props => {
  const { api } = props;
  const [blockNumber, setBlockNumber] = useState(0);
  const bestNumber = api && api.derive && api.derive.chain && (props.finalized
    ? api.derive.chain.bestNumberFinalized
    : api.derive.chain.bestNumber);
  useEffect(() => {
    let unsubscribeAll;
    bestNumber && bestNumber(blockNumber => {
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
  } = props;
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
  const { apiState, api, onClickNode } = props;
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
    <Card className='encointer-map-node-info' style={props.style || {}}>
      <Card.Content className='info' onClick={onClickNode}>
        <Card.Header>{nodeInfo.nodeName} <Icon name='chevron down' /></Card.Header>
        <Card.Meta>{`${nodeInfo.chain || ''} v${nodeInfo.nodeVersion || ''}`}</Card.Meta>
      </Card.Content>
      {
        apiState === 'READY'
          ? <Card.Content className='blocks'>
            {
              getCurrentCeremonyIndex
                ? <React.Fragment>
                  <Card.Meta></Card.Meta>
                  <div className='block-current'>current block #<Blocks api={api} /></div>
                  <div className='finalized-current'>finalized block #<Blocks finalized api={api} /></div>
                  <div className='ceremony'><CeremonyIndex api={api} /></div>
                </React.Fragment>
                : <React.Fragment>
                  <div className='loading'>
                    <Loader active size='medium' inline='centered' />
                  </div>
                </React.Fragment>
            }
          </Card.Content>
          : <Card.Content className='loading'>
            {
              apiState !== 'ERROR'
                ? <Card.Meta><Loader active size='small' inline /> Connecting to the blockchain</Card.Meta>
                : <Card.Meta className='error'>Error connecting to the blockchain</Card.Meta>
            }
          </Card.Content>
      }
    </Card>
  );
}

export default function MapNodeInfo (props) {
  return <MapNodeInfoMain {...props} />;
}
