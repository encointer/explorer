import React from 'react';

import 'semantic-ui-css/semantic.min.css';
import { SubstrateContextProvider } from './substrate-lib';

import Map from './Map';
import './style.css';

function Main () {
  return (<Map debug />);
}

export default function App () {
  return (
    <SubstrateContextProvider>
      <Main />
    </SubstrateContextProvider>
  );
}
