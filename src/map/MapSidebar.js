import React, { useEffect, useState, useRef } from 'react';
import { Button, Segment, Header, Icon, List, Message, Sidebar } from 'semantic-ui-react';
import Big from 'big.js';
import toFormat from 'toformat';

import { parseI64F64 } from '../utils';

const BigFormat = toFormat(Big);

function MapSidebarMain (props) {
  const {
    api,
    debug,
    onClose,
    onShow,
    hash,
    direction,
    width,
    participantCount,
    lastParticipantCount,
    lastMeetupCount,
    meetupCount,
    data: {
      name, cid, demurrage
    }
  } = props;
  const visible = !!hash.length;
  const ref = useRef();
  const isVertical = direction === 'top' || direction === 'bottom';

  const [bootstrappers, setBootstrappers] = useState([]);
  const [moneysupply, setMoneysupply] = useState(null);

  /// Fetch bootstrappers
  useEffect(() => {
    if (cid && api.query.encointerCurrencies) {
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
    if (cid && api.query.encointerBalances) {
      debug && console.log('GETTING MONEYSUPPLY', cid);
      api.query.encointerBalances
        .totalIssuance(cid)
        .then(_ => {
          debug && console.log('MONEYSUPPLY RECEIVED', _);
          setMoneysupply(parseI64F64(_.get('principal')));
        });
    }
  }, [api.query.encointerBalances, cid, debug]);

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

        <Segment.Group horizontal>
          <Segment>
            <Header sub>Demurrage rate (per month):</Header>
            {demurrage && demurrage.toFixed(2)}%
            <Header sub>participants registered:</Header>
            {participantCount}
            <Header sub>participants registered in last ceremony:</Header>
            {lastParticipantCount}
          </Segment>
          <Segment>
            <Header sub>Money supply:</Header>
            <p>{ moneysupply && (new BigFormat(moneysupply)).toFormat(2) }</p>
            <Header sub>meetups assigned:</Header>
            {meetupCount}
            <Header sub>meetups assigned in last ceremony:</Header>
            {lastMeetupCount}
          </Segment>
        </Segment.Group>

        <Segment loading={!bootstrappers.length} stacked>
          <Header sub>List of bootstrappers:</Header>
          <List>{
            bootstrappers.map(
              _ => <List.Item key={_}>{_}</List.Item>
            )
          }</List>
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

export default React.memo(function MapSidebar (props) {
  const { api } = props;
  return api && api.query ? (
    <MapSidebarMain {...props} />
  ) : null;
}, (prev, cur) => (
  prev.hash === cur.hash && (
    cur.hash
      ? prev.participantCount === cur.participantCount &&
      prev.lastParticipantCount === cur.lastParticipantCount &&
      prev.meetupCount === cur.meetupCount &&
      prev.lastMeetupCount === cur.lastMeetupCount
      : true)
));
