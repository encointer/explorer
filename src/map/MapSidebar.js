import React, { useEffect, useCallback, useState, useRef } from 'react';
import { Button, Segment, Header, List, Message, Sidebar } from 'semantic-ui-react';
import Big from 'big.js';
import toFormat from 'toformat';
import { parseEncointerBalance } from '@encointer/types';

import { getCeremonyIncome } from '@encointer/node-api';
import { parseI64F64 } from '@encointer/util';
import { ipfsCidFromHex } from '../utils';

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
    currentPhase,
    data: {
      name, cid, demurrage, demurragePerBlock
    }
  } = props;
  const visible = !!hash.length;
  const ref = useRef();
  const isVertical = direction === 'top' || direction === 'bottom';

  const [bootstrappers, setBootstrappers] = useState([]);
  const [entry, setEntry] = useState(null);
  const [currentBlock, setCurrentBlock] = useState(1);
  const [moneySupply, setMoneySupply] = useState(0);

  useEffect(() => {
    let unsubscribeAll;
    const bestNumber = api.derive.chain.bestNumber;
    bestNumber(blockNumber => {
      setCurrentBlock(blockNumber.toNumber());
    }).then(unsub => {
      console.log('U', unsub);
      unsubscribeAll = unsub;
    });
    return () => unsubscribeAll && unsubscribeAll();
  }, [api.derive.chain.bestNumber]);

  /// Fetch bootstrappers
  useEffect(() => {
    let unsubscribeAll;
    if (cid && api.query.encointerCommunities) {
      // debug && console.log('GETTING BOOTSTRAPPERS', cid);
      api.query.encointerCommunities
        .bootstrappers(cid, bootstrappers => {
          debug && console.log('BOOTSTRAPPERS RECEIVED', bootstrappers);
          setBootstrappers(bootstrappers.toJSON());
        }).then(unsub => {
          unsubscribeAll = unsub;
        })
        .catch(console.error);
      return () => unsubscribeAll && unsubscribeAll();
    }
  }, [api.query.encointerCommunities, cid, debug]);

  /// Fetch money supply
  useEffect(() => {
    let unsubscribeAll;
    if (cid && api.query.encointerBalances) {
      debug && console.log('GETTING MONEYSUPPLY', cid);
      api.query.encointerBalances
        .totalIssuance(cid, balanceEntry => {
          debug && console.log('MONEYSUPPLY RECEIVED', JSON.stringify(balanceEntry));
          setEntry({
            principal: parseEncointerBalance(balanceEntry.principal.bits),
            lastUpdate: balanceEntry.lastUpdate.toNumber()
          });
        }).then(unsub => {
          unsubscribeAll = unsub;
        })
        .catch(console.error);
      return () => unsubscribeAll && unsubscribeAll();
    }
  }, [api.query.encointerBalances, cid, debug]);

  /// Apply demurrage
  const applyDemurrage = useCallback(() => {
    const moneySupply = (entry && entry.principal > 0) ? entry.principal * Math.exp(-demurragePerBlock * (currentBlock - entry.lastUpdate)) : 0;
    setMoneySupply(moneySupply);
  }, [demurragePerBlock, currentBlock, entry]
  );

  useEffect(() => {
    applyDemurrage();
  }, [applyDemurrage]);

  /// Handler when sidebar completely shows (animation stops)
  const handleShow = () => ref.current && onShow(ref.current.ref.current[
    `offset${isVertical ? 'Height' : 'Width'}`
  ]);
  const [allReputableNumber, setAllReputableNumber] = useState([]);
  const [tentativeGrowth, setTentativeGrowth] = useState([]);
  // gets the current number of Reputables
  useEffect(() => {
    getAllReputables(api, cid).then((reputables) => {
      debug && console.log(`All unique reputables: ${reputables}`);
      setAllReputableNumber([reputables.length]);
    });
  }, [api, cid, debug]);

  useEffect(() => {
    /**
     * Gets the relative tentative growth based on the current meetups registrations.
     * Returns the max allowed growth if the number of registered newbies exceeds the allowed newbie seats.
     */
    async function getTentativeGrowth (allReputableNumber) {
      if (!allReputableNumber || allReputableNumber === 0) {
        return 0;
      }

      const CommunityCeremony = api.registry.getOrUnknown('CommunityCeremony');
      const currentCeremonyIndex = await api.query.encointerScheduler.currentCeremonyIndex();
      const currentCommunityCeremony = new CommunityCeremony(api.registry, [cid, currentCeremonyIndex]);

      const [assignmentCounts, endorsees] = await Promise.all([
        api.query.encointerCeremonies.assignmentCounts(currentCommunityCeremony),
        api.query.encointerCeremonies.endorseeCount(currentCommunityCeremony)
      ]);

      const newbies = assignmentCounts.newbies;
      // round to 2 digits
      return Math.round(((newbies.toNumber() + endorsees.toNumber()) / allReputableNumber) * 100);
    }

    getTentativeGrowth(allReputableNumber).then(data => {
      setTentativeGrowth(data);
    });
  }, [allReputableNumber, api, cid]);

  // gets the nominal Income of a Community
  const [nominalIncome, setNominalIncome] = useState([]);
  useEffect(() => {
    async function getNominalIncome () {
      const nominalIncome = await getCeremonyIncome(api, cid);
      return parseI64F64(nominalIncome);
    }
    getNominalIncome().then((income) => {
      setNominalIncome(income);
    });
  }, [api, cid]);

  const [ceremonyRegistry, setRegistry] = useState({
    bootstrappers: 0,
    reputables: 0,
    endorsees: 0,
    newbies: 0,
    unassignedNewbies: 0 // Todo: calculate how many newbies will not be assigned currently
  });

  useEffect(() => {
    async function getCurrentCeremonyRegistry () {
      const CommunityCeremony = api.registry.getOrUnknown('CommunityCeremony');
      const currentCeremonyIndex = await api.query.encointerScheduler.currentCeremonyIndex();
      const currentCommunityCeremony = new CommunityCeremony(api.registry, [cid, currentCeremonyIndex]);

      return Promise.all([
        api.query.encointerCeremonies.bootstrapperCount(currentCommunityCeremony),
        api.query.encointerCeremonies.reputableCount(currentCommunityCeremony),
        api.query.encointerCeremonies.endorseeCount(currentCommunityCeremony),
        api.query.encointerCeremonies.newbieCount(currentCommunityCeremony),
        api.query.encointerCeremonies.assignmentCounts(currentCommunityCeremony)
      ]);
    }

    getCurrentCeremonyRegistry().then((data) => {
      if (currentPhase.phase === 0) {
        setRegistry({
          bootstrappers: data[0],
          reputables: data[1],
          endorsees: data[2],
          newbies: data[3],
          unassignedNewbies: 0 // Todo: calculate how many newbies will not be assigned currently
        });
      } else {
        setRegistry({
          unassignedNewbies: data[3] - data[4].newbies,
          ...data[4]
        });
      }
    });
  }, [api, cid, participantCount, currentPhase]);

  const [ipfsUrl, setIpfsUrl] = useState([]);
  // gets the community logo from a public ipfs gateway
  useEffect(() => {
    async function getCommunityLogo () {
      const ipfsCidHex = (await api.query.encointerCommunities.communityMetadata(cid)).assets;
      const ipfsCid = ipfsCidFromHex(ipfsCidHex);

      setIpfsUrl('https://ipfs.io/ipfs/' + ipfsCid + '/community_icon.svg');
    }
    getCommunityLogo();
  }, [api, cid]);

  const [submittedAttesters, setSubmittedAttesters] = useState([]);

  useEffect(() => {
    async function getNumberOfSubmittedAttesters () {
      const CommunityCeremony = api.registry.getOrUnknown('CommunityCeremony');
      const currentCeremonyIndex = await api.query.encointerScheduler.currentCeremonyIndex();
      const currentCommunityCeremony = new CommunityCeremony(api.registry, [cid, currentCeremonyIndex]);
      const numberOfSubmittedAttesters = await api.query.encointerCeremonies.attestationCount(currentCommunityCeremony);

      setSubmittedAttesters(numberOfSubmittedAttesters.toNumber());
    }
    getNumberOfSubmittedAttesters();
  }, [api, cid]);

  function showNumberOfSubmittedAttesters () {
    if (submittedAttesters === null) {
      setSubmittedAttesters(0);
    }
    return (
      <div>
        <Header sub>Number of attestation submissions: </Header>
        {submittedAttesters}
      </div>
    );
  }

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
          <img src={ipfsUrl} alt = ""/>
          <Header.Content>Currency info</Header.Content>
        </Header>
      </Segment>

      <Segment textAlign='center'>
        <Header sub textAlign='left'>Currency ID:</Header>
        <Message size='small' color='blue'>{hash}</Message>
        <p>{name}</p>
      </Segment>

      <Segment.Group textalign='left'>
        <Segment>
        {(currentPhase.phase === 0)
          ? getRegisteredParticipantsComponent(ceremonyRegistry)
          : getAssignedParticipantsComponent(ceremonyRegistry)
        }
        </Segment>
      </Segment.Group>

      <Segment.Group>

        <Segment.Group horizontal>
          <Segment>
            <Header sub>nominal Income:</Header>
            {nominalIncome}
            <Header sub>Demurrage rate (per month):</Header>
            {demurrage && demurrage.toFixed(2)}%
            <Header sub>participants registered:</Header>
            {participantCount}
            <Header sub>Number of Reputables:</Header>
            {allReputableNumber}
            <Header sub>participants registered in last ceremony:</Header>
            {lastParticipantCount}
          </Segment>
          <Segment>
            <Header sub>Money supply:</Header>
            <p>{!isNaN(moneySupply) && (new BigFormat(moneySupply)).toFormat(2)}</p>
            <Header sub>meetups assigned:</Header>
            {meetupCount}
            <Header sub>tentative Community Growth: </Header>
            {tentativeGrowth}%
            <Header sub>meetups assigned in last ceremony:</Header>
            {lastMeetupCount}
            <Header sub></Header>
            {(currentPhase.phase === 2)
              ? showNumberOfSubmittedAttesters()
              : null
            }
          </Segment>
        </Segment.Group>

        <Segment loading={!bootstrappers.length} stacked>
          <Header sub>List of bootstrappers:</Header>
          <List>{
            bootstrappers.map(
              bootstrappers => <List.Item key={bootstrappers}>{bootstrappers}</List.Item>
            )
          }</List>
        </Segment>

      </Segment.Group>

      <Segment textalign='right' className='map-sidebar-close'>
        <Button
          content='Close'
          icon={'angle ' + (isVertical ? 'down' : 'right')}
          labelPosition='right'
          onClick={onClose}/>
      </Segment>

    </Sidebar>
  );
} export default React.memo(function MapSidebar (props) {
  const { api } = props;
  return api && api.query
    ? (
      <MapSidebarMain {...props} />
      )
    : null;
}, (prev, cur) => (
  prev.hash === cur.hash && (
    cur.hash
      ? prev.participantCount === cur.participantCount &&
      prev.lastParticipantCount === cur.lastParticipantCount &&
      prev.meetupCount === cur.meetupCount &&
      prev.lastMeetupCount === cur.lastMeetupCount
      : true)
));

function getRegisteredParticipantsComponent (ceremonyRegistry) {
  return (<div>
    <h4>Registered participants for this ceremony:</h4>
    <li>Bootstrapper: {ceremonyRegistry.bootstrappers.toString()}</li>
    <li>Reputables: {ceremonyRegistry.reputables.toString()}</li>
    <li>Endorsees: {ceremonyRegistry.endorsees.toString()}</li>
    <li>Newbies: {ceremonyRegistry.newbies.toString()}</li>
  </div>);
}

function getAssignedParticipantsComponent (ceremonyRegistry) {
  return (<div>
    <h4>Assigned Participants for this ceremony:</h4>
    <li>Bootstrapper: {ceremonyRegistry.bootstrappers.toString()}</li>
    <li>Reputables: {ceremonyRegistry.reputables.toString()}</li>
    <li>Endorsees: {ceremonyRegistry.endorsees.toString()}</li>
    <li>Newbies: {ceremonyRegistry.newbies.toString()}</li>
    <li color='red'>Unassigned Newbies: {ceremonyRegistry.unassignedNewbies.toString()}</li>
  </div>);
}

async function getAllReputables (api, cid) {
  const CommunityCeremony = api.registry.getOrUnknown('CommunityCeremony');

  const [reputationLifetime, currentCeremonyIndex] = await Promise.all([
    api.query.encointerCeremonies.reputationLifetime(),
    api.query.encointerScheduler.currentCeremonyIndex()
  ]);

  const promises = [];
  const lowerIndex = Math.max(0, currentCeremonyIndex - reputationLifetime);

  for (let cIndex = lowerIndex; cIndex <= currentCeremonyIndex; cIndex++) {
    const communityCeremony = new CommunityCeremony(api.registry, [cid, cIndex]);
    promises.push(
      api.query.encointerCeremonies.participantReputation.keys(communityCeremony)
        .then(extractAccountIdFromParticipantReputationMapKeys)
    );
  }

  const arrayOfReputablesArray = await Promise.all(promises);
  const arrayOfReputables = arrayOfReputablesArray.flat();

  // JSON.stringify is needed because objects are only equal if they point to the same reference.
  return [...new Set(arrayOfReputables.map((account) => JSON.stringify(account)))];
}

/**
 * This is not intuitive.
 * See explanation https://polkadot.js.org/docs/api/start/api.query.other/#map-keys--entries.
 */
function extractAccountIdFromParticipantReputationMapKeys (keys) {
  return keys.map(({ args: [_cc, accountId] }) => accountId);
}
