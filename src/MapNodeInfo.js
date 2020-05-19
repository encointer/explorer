import React, { useEffect, useState } from 'react';
import { Card } from 'semantic-ui-react';

import { useSubstrate } from './substrate-lib';

function MapNodeInfoMain () {
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
    ? <Card className='encointer-map-node-info'
      header={nodeInfo.nodeName}
      meta={`${nodeInfo.chain || ''} v${nodeInfo.nodeVersion}`}
    /> : null);
}

export default function MapNodeInfo (props) {
  const { api } = useSubstrate();
  return api.rpc &&
    api.rpc.system &&
    api.rpc.system.chain &&
    api.rpc.system.name &&
    api.rpc.system.version ? (
      <MapNodeInfoMain {...props} />
    ) : null;
}
