import { useContext, useEffect, useCallback } from 'react';
import { ApiPromise } from '@polkadot/api';
import { WsProvider } from '@polkadot/rpc-provider';
import { options } from '@encointer/node-api';

import { SubstrateContext } from './SubstrateContext';

const useSubstrate = () => {
  const [state, dispatch] = useContext(SubstrateContext);

  // `useCallback` so that returning memoized function and not created
  //   everytime, and thus re-render.
  const { api, socket } = state;
  const connect = useCallback(async () => {
    if (api) return;

    const provider = new WsProvider(socket);
    // Connect to Encointer
    const _api = await new ApiPromise({
      ...options(
        {
          types: {
            CurrencyIdentifier: 'Hash',
            CurrencyCeremony: '(CurrencyIdentifier,CeremonyIndexType)',
            CurrencyPropertiesType: {
              name_utf8: 'Vec<u8>',
              demurrage_per_block: 'Demurrage'
            }
          }
        }
      ),
      provider
    });

    // We want to listen to event for disconnection and reconnection.
    //  That's why we set for listeners.
    _api.on('connected', () => {
      dispatch({ type: 'CONNECT', payload: _api });
      // `ready` event is not emitted upon reconnection. So we check explicitly here.
      _api.isReady.then((_api) => dispatch({ type: 'CONNECT_SUCCESS' }));
    });
    _api.on('ready', () => dispatch({ type: 'CONNECT_SUCCESS' }));
    _api.on('error', () => dispatch({ type: 'CONNECT_ERROR' }));
  }, [api, socket, dispatch]);

  useEffect(() => {
    connect();
  }, [connect]);

  return { ...state, dispatch };
};

export default useSubstrate;
