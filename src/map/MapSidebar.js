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
    async function getReputableCount () {
      const CommunityCeremony = api.registry.getOrUnknown('CommunityCeremony');

      const [reputationLifetime, currentCeremonyIndex] = await Promise.all([
        api.query.encointerCeremonies.reputationLifetime(),
        api.query.encointerScheduler.currentCeremonyIndex()
      ]);
      const tempAllRepSet = new Set();
      const promises = [];
      const lowerIndex = Math.max(0, currentCeremonyIndex - reputationLifetime);

      for (let cIndex = lowerIndex; cIndex <= currentCeremonyIndex; cIndex++) {
        const communityCeremony = new CommunityCeremony(api.registry, [cid, cIndex]);
        promises.push(api.query.encointerCeremonies.participantReputation.keys(communityCeremony));
      }
      const arrayOfReputables = await Promise.all(promises);
      for (const reputables of arrayOfReputables) {
        for (const reputable of reputables) {
          tempAllRepSet.add(reputable);
        }
      }
      setAllReputableNumber(tempAllRepSet.size);
    }
    getReputableCount();
  }, [api, cid]);

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
      const meetupNewbieLimitDivider = api.consts.encointerCeremonies.meetupNewbieLimitDivider;
      const currentCeremonyIndex = await api.query.encointerScheduler.currentCeremonyIndex();
      const currentCommunityCeremony = new CommunityCeremony(api.registry, [cid, currentCeremonyIndex]);
      const newbies = await api.query.encointerCeremonies.newbieCount(currentCommunityCeremony);

      const maxGrowthAbsolute = Math.min(
        newbies,
        Math.floor(allReputableNumber / meetupNewbieLimitDivider)
      );

      // round to 2 digits
      return Math.round(maxGrowthAbsolute / allReputableNumber * 100) / 100;
    }

    getTentativeGrowth(allReputableNumber).then(data => {
      setTentativeGrowth(data);
    });
  }, [allReputableNumber, api, cid]);

  // gets the nominal Income of a Community
  const [nominalIncome, setNominalIncome] = useState([]);
  useEffect(() => {
    async function getNominalIncome () {
      const tempNominalIncome = await getCeremonyIncome(api, cid);
      return parseI64F64(tempNominalIncome);
    }
    let isMountedNominal = true;
    getNominalIncome().then((data) => {
      if (isMountedNominal) setNominalIncome(' ' + data);
    });
    return () => { isMountedNominal = false; };
  }, [api, cid]);

  const [registeredBootstrappers, setRegisteredBootstrappers] = useState([]);
  const [registeredReputables, setRegisteredReputables] = useState([]);
  const [registeredEndorsees, setRegisteredEndorsees] = useState([]);
  const [registeredNewbies, setRegisteredNewbies] = useState([]);
  const [unassignedNewbies, setUnassignedNewbies] = useState([]);
  // gets the data of all people that registered for a Ceremony
  function GetCeremonyData () {
    useEffect(() => {
      async function getCurrentCeremonyRegistry () {
        const CommunityCeremony = api.registry.getOrUnknown('CommunityCeremony');
        const currentCeremonyIndex = await api.query.encointerScheduler.currentCeremonyIndex();
        const currentCommunityCeremony = new CommunityCeremony(api.registry, [cid, currentCeremonyIndex]);

        return await Promise.all([
          api.query.encointerCeremonies.bootstrapperCount(currentCommunityCeremony),
          api.query.encointerCeremonies.reputableCount(currentCommunityCeremony),
          api.query.encointerCeremonies.endorseeCount(currentCommunityCeremony),
          api.query.encointerCeremonies.newbieCount(currentCommunityCeremony),
          api.query.encointerCeremonies.assignmentCounts(currentCommunityCeremony)
        ]);
      }

      let isMounted = true;
      getCurrentCeremonyRegistry().then((data) => {
        if (currentPhase.phase === 0) {
          if (isMounted) {
            setRegisteredBootstrappers(data[0]);
            setRegisteredReputables(data[1]);
            setRegisteredEndorsees(data[2]);
            setRegisteredNewbies(data[3]);
            setUnassignedNewbies(0); // Todo: calculate how many newbies will not be assigned currently
          }
        } else {
          if (isMounted) {
            setRegisteredBootstrappers(data[4].bootstrappers);
            setRegisteredReputables(data[4].reputables);
            setRegisteredEndorsees(data[4].endorsees);
            setRegisteredNewbies(data[4].newbies);
            setUnassignedNewbies(data[3] - data[4].newbies);
          }
        }
      });
      return () => { isMounted = false; };
    }, []);
    if (currentPhase.phase === 0) {
      return (<div textalign='left'>
          <h4>Registered participants for this ceremony:</h4>
          <li>Bootstrapper: {registeredBootstrappers.toString()}</li>
          <li>Reputables: {registeredReputables.toString()}</li>
          <li>Endorsees: {registeredEndorsees.toString()}</li>
          <li>Newbies: {registeredNewbies.toString()}</li>
      </div>);
    } else {
      return (<div textalign='left'>
          <h4>Assigned Participants for this ceremony:</h4>
          <li >Bootstrapper: {registeredBootstrappers.toString()} </li>
          <li> Reputables: {registeredReputables.toString()}</li>
          <li> Endorsees: {registeredEndorsees.toString()}</li>
          <li>Newbies: {registeredNewbies.toString()}</li>
          <li color='red'>unassigned Newbies: {(unassignedNewbies != null) ? unassignedNewbies.toString() : '0'}</li>
      </div>);
    }
  }

  const [ipfsUrl, setIpfsUrl] = useState([]);
  // gets the comunity logo from a public ipfs gateway
  useEffect(() => {
    async function getCommunityLogo () {
      const ipfsCidHex = (await api.query.encointerCommunities.communityMetadata(cid)).assets;
      const ipfsCid = ipfsCidFromHex(ipfsCidHex);

      setIpfsUrl('https://ipfs.io/ipfs/' + ipfsCid + '/community_icon.svg');
    }
    getCommunityLogo();
  }, [api, cid]);

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

      <Segment.Group textAlign='left'>
        <Segment>
        {GetCeremonyData()}
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
            <Header sub>tentative Community Growth (excluding endorsements): </Header>
            {tentativeGrowth}%
            <Header sub>meetups assigned in last ceremony:</Header>
            {lastMeetupCount}
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

      <Segment textAlign='right' className='map-sidebar-close'>
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
