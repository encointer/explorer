import React, { createRef } from 'react';
import { Container, Dimmer, Loader, Grid } from 'semantic-ui-react';

import 'semantic-ui-css/semantic.min.css';
import { SubstrateContextProvider, useSubstrate } from './substrate-lib';
import { DeveloperConsole } from './substrate-lib/components';

import BlockNumber from './BlockNumber';
import NodeInfo from './NodeInfo';
import Map from './Map';
import './style.css';

function Main () {
  const { apiState, keyringState } = useSubstrate();

  const loader = text => (
    <Dimmer active>
      <Loader size='small'>{text}</Loader>
    </Dimmer>
  );

  if (apiState === 'ERROR') return loader('Error connecting to the blockchain');
  else if (apiState !== 'READY') return loader('Connecting to the blockchain');

  if (keyringState !== 'READY') {
    return loader(
      "Loading accounts (please review any extension's authorization)"
    );
  }

  const contextRef = createRef();

  return (
    <div ref={contextRef} className='wrapper'>
      <Map />
      <Container>
        <Grid stackable columns='equal'>
          <Grid.Row>
            <BlockNumber />
            <BlockNumber finalized />
            <NodeInfo />
          </Grid.Row>
        </Grid>
        <DeveloperConsole />
      </Container>
    </div>
  );
}

export default function App () {
  return (
    <SubstrateContextProvider>
      <Main />
    </SubstrateContextProvider>
  );
}
