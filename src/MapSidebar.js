import React, { useEffect, useState, useRef } from 'react';
import { Button, Segment, Header, Icon, List, Message, Sidebar } from 'semantic-ui-react';
import { useSubstrate } from './substrate-lib';

function MapSidebarMain (props) {
  const {
    debug, onClose, onShow, hash, direction, width, data: {
      name, cid, demurrage
    }
  } = props;
  const visible = !!hash.length;
  const ref = useRef();
  const isVertical = direction === 'top' || direction === 'bottom';

  const { api } = useSubstrate();
  const [bootstrappers, setBootstrappers] = useState([]);
  const [moneysupply, setMoneysupply] = useState({});

  /// Fetch bootstrappers
  useEffect(() => {
    if (cid) {
      debug && console.log('GETTING BOOTSTRAPPERS', cid);
      api.query.encointerCurrencies
        .bootstrappers(cid)
        .then(_ => {
          debug && console.log('BOOTSTRAPPERS RECEIVED', _);
          setBootstrappers(_.toJSON());
        });
    }
  }, [api.query.encointerCurrencies, cid, debug]);

  /// Fetch money supply
  useEffect(() => {
    if (cid) {
      api.query.encointerBalances
        .totalIssuance(cid)
        .then(_ => setMoneysupply(_.toJSON()));
    }
  }, [api.query.encointerBalances, cid]);

  /// Handler when sidebar completely shows (animation stops)
  const handleShow = () => ref.current && onShow(ref.current.ref.current[
    `offset${isVertical ? 'Height' : 'Width'}`
  ]);

  return (
    <Sidebar
      className='details-sidebar'
      ref={ref}
      as={Segment.Group}
      animation='overlay'
      icon='labeled'

      direction={direction}
      visible={visible}
      width={width}
      onShow={handleShow}
    >
      <Segment padded>
        <Header>
          <Icon name='money bill alternate' />
          <Header.Content>Currency info</Header.Content>
        </Header>
      </Segment>

      <Segment textAlign='center'>
        <Header sub textAlign='left'>Currency ID:</Header>
        <Message size='small' color='blue'>{hash}</Message>
        <p>{name}</p>
      </Segment>

      <Segment.Group>

        <Segment>
          <Header sub>Demurrage rate (per month):</Header>
          {demurrage}
        </Segment>

        <Segment loading={!bootstrappers.length}>
          <Header sub>List of bootstrappers:</Header>
          <List>{
            bootstrappers.map(
              _ => <List.Item key={_}>{_}</List.Item>
            )
          }</List>
        </Segment>

        <Segment loading={!moneysupply.length} stacked>
          <Header sub>Money supply:</Header>
          <p>{moneysupply[1]}</p>
        </Segment>

      </Segment.Group>

      <Segment textAlign='right' className='map-sidebar-close'>
        <Button
          content='Close'
          icon={'angle ' + (isVertical ? 'down' : 'right')}
          labelPosition='right'
          onClick={onClose}/>
      </Segment>

    </Sidebar>
  );
}

export default function MapBlockNumber (props) {
  const { api } = useSubstrate();
  return api.query &&
    api.query.encointerCurrencies &&
    api.query.encointerBalances ? (
      <MapSidebarMain {...props} />
    ) : null;
}
