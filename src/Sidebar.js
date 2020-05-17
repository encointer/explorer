import React, { useEffect, useState } from 'react';
import { Button, Container, Segment, Header, Icon, List, Message } from 'semantic-ui-react';
import { useSubstrate } from './substrate-lib';
import * as bs58 from 'bs58';

export function Sidebar (props) {
  const { onClose, hash, data: { name, cid, demurrage } } = props;
  const { api } = useSubstrate();
  const [bootstrappers, setBootstrappers] = useState([]);
  const [moneysupply, setMoneysupply] = useState({});
  useEffect(() => {
    if (cid) {
      api.query.encointerCurrencies
        .bootstrappers(cid)
        .then(setBootstrappers);
    }
  }, [api.query.encointerCurrencies, cid]);

  useEffect(() => {
    if (cid) {
      api.query.encointerBalances
        .totalIssuance(cid)
        .then(_ => setMoneysupply(_.toJSON()));
    }
  }, [api.query.encointerBalances, cid]);

  return (<Container id='sidebar'>

    <Segment.Group raised>
      <Segment padded>
        <Header>
          <Icon name='money bill alternate' />
          <Header.Content>Currency info</Header.Content>
        </Header>
      </Segment>

      <Segment>
        <Header sub>Currency ID: </Header>
        <Message size='small' color='blue'>{hash}</Message>
      </Segment>

      <Segment.Group>

        <Segment>{name}</Segment>

        <Segment>
          <Header sub>Demurrage rate (per block):</Header>
          {demurrage}
        </Segment>

        <Segment loading={!bootstrappers.length}>
          <Header sub>List of bootstrappers:</Header>
          <List>{
            bootstrappers.map(bs58.encode).map(
              _ => <List.Item key={_}>{_}</List.Item>
            )
          }</List>
        </Segment>

        <Segment loading={!moneysupply.length} stacked>
          <Header sub>Money supply:</Header>
          <p>{moneysupply[1]}</p>
        </Segment>

      </Segment.Group>

    </Segment.Group>

    <Container textAlign="right">
      <Button content='Close' icon='angle right' labelPosition='right' onClick={onClose}/>
    </Container>

  </Container>
  );
}
