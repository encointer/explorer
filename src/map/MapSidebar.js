import React, { useEffect, useCallback, useState, useRef } from 'react';
import { Button, Segment, Header, Icon, List, Message, Sidebar } from 'semantic-ui-react';
import Big from 'big.js';
import toFormat from 'toformat';
import { parseEncointerBalance } from '@encointer/types';

import { getCeremonyIncome, getNextMeetupTime } from '@encointer/node-api';
import { parseI64F64 } from '@encointer/util';
import { bnToU8a } from '@polkadot/util';
import { stringToDegree } from '@encointer/types';

/**
 * Parses a location json with fields as number strings to a `Location` object.
 *
 * There is a rust vs. JS endian issue with numbers: https://github.com/polkadot-js/api/issues/4313.
 *
 * tl;dr: If the returned location is processed:
 *  * by a node (rust), use isLe = false.
 *  * by JS, e.g. `parseDegree`, use isLe = true.
 *
 *
 * @param api
 * @param location fields as strings, e.g. '35.2313515312'
 * @param isLe
 * @returns {Location} Location with fields as fixed-point numbers
 */
export function locationFromJson (api, location, isLe = true) {
  return api.createType('Location', {
    lat: bnToU8a(stringToDegree(location.lat), 128, isLe),
    lon: bnToU8a(stringToDegree(location.lon), 128, isLe)
  });
}

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
    currentPhase: {
      phase: currentPhase
    },
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
  const [allReputableNumber, setallReputableNumber] = useState([]);
  const [tentativeGrowth, setTentativeGrowth] = useState([]);
  const CommunityCeremony = api.registry.getOrUnknown('CommunityCeremony');
  // gets the current number of Reputables
  useEffect(() => {
    async function getnumRep () {
      const [reputationLifetime, currentCeremonyIndex] = await Promise.all([
        api.query.encointerCeremonies.reputationLifetime(),
        api.query.encointerScheduler.currentCeremonyIndex()
      ]);
      const tempAllRepSet = new Set();
      const promises = [];
      for (let cIndex = currentCeremonyIndex - reputationLifetime; cIndex <= currentCeremonyIndex; cIndex++) {
        const communityCeremony = new CommunityCeremony(api.registry, [cid, cIndex]);
        promises.push(api.query.encointerCeremonies.participantReputation.keys(communityCeremony));
      }
      const arrayOfRreputables = await Promise.all(promises);
      for (const reputables of arrayOfRreputables) {
        for (const reputable of reputables) {
          tempAllRepSet.add(reputable);
        }
      }
      setallReputableNumber(tempAllRepSet.size);
    }
    getnumRep();
  }, [allReputableNumber, setallReputableNumber, api, CommunityCeremony, cid]);

  // gets the tentative growth of Reputatbles
  useEffect(() => {
    async function getTentativeGrowth (allReputableNumber) {
      const currentCeremonyIndex = await api.query.encointerScheduler.currentCeremonyIndex();
      const currentCommunityCeremony = new CommunityCeremony(api.registry, [cid, currentCeremonyIndex]);
      const lastCommunityCeremony = new CommunityCeremony(api.registry, [cid, (currentCeremonyIndex - 1)]);
      const [currentparticipantReputation, lastparticipantReputation] = await Promise.all([
        api.query.encointerCeremonies.participantReputation.keys(currentCommunityCeremony),
        api.query.encointerCeremonies.participantReputation.keys(lastCommunityCeremony)
      ]);
      const toberounded = ((currentparticipantReputation.length - lastparticipantReputation.length) / allReputableNumber);
      return (allReputableNumber != null) ? (Math.round(toberounded * Math.pow(10, 2)) / Math.pow(10, 2)) : null;
    }
    let isMounted = true;
    if (allReputableNumber) {
      getTentativeGrowth(allReputableNumber).then(data => {
        if (isMounted) setTentativeGrowth(data);
      });
      return () => { isMounted = false; };
    }
  }, [allReputableNumber, tentativeGrowth, setTentativeGrowth, api, CommunityCeremony, cid]);

  const [nextMeetupTime, setNextMeetupTime]= useState([]);
  // gets the date of the next Meetup
  useEffect(() => {
    async function getNextMeetupDate(){
      const meetupLocations = await api.rpc.encointer.getLocations(cid);
      const tempLocation = locationFromJson(api, meetupLocations[0]);
      const temporaryTime = await getNextMeetupTime(api, tempLocation);
      const tempdate = new Date(temporaryTime.toNumber());
      const temparray = (tempdate.toString()).split("G");
      const tempresultarray = temparray[0].split(" ");
      setNextMeetupTime (" "+tempresultarray[0]+" "+tempresultarray[2]+" "+tempresultarray[1]+ " "+tempresultarray[3]);
    }
    getNextMeetupDate();
  }, [api,nextMeetupTime, setNextMeetupTime, cid]);

  // gets the nominal Income of a Community
  const [nominalIncome, setNominalIncome]= useState([]);
  useEffect(() => {
    async function getNominalIncome(){
      const tempNominalIncome = await getCeremonyIncome(api, cid);
      return parseI64F64(tempNominalIncome);
    }
    let isMountedNominal = true 
    getNominalIncome().then((data) => {
      if (isMountedNominal) setNominalIncome(" "+data);
    });
    return () => {isMountedNominal = false; };

  },[nominalIncome, setNominalIncome,getCeremonyIncome, api, cid])

  const [registeredBootstrappers, setregisteredBootstrappers]= useState([]);
  const [registeredReputables, setregisteredReputables]= useState([]);
  const [registeredEndorseees, setregisteredEndorsees]= useState([]);
  const [registeredNewbies, setregisteredNewbies]= useState([]);
  const [unassignedNewbies, setunassignedNewbies]= useState([]);
  
// gets the data of all people that registered for a Ceremony
  function showPhasepeopleData(){
    useEffect(() => {
      async function getPhasepeopleData(){
        const currentCeremonyIndex = await api.query.encointerScheduler.currentCeremonyIndex();
        const currentCommunityCeremony = new CommunityCeremony(api.registry, [cid, currentCeremonyIndex])
        const [tempregisteredBootstrappers, tempregisteredReputables, tempregisteredEndorseees,tempregisteredNewbies, assignmentCounts] = await Promise.all([
          api.query.encointerCeremonies.bootstrapperCount(currentCommunityCeremony),
          api.query.encointerCeremonies.reputableCount(currentCommunityCeremony),
          api.query.encointerCeremonies.endorseeCount(currentCommunityCeremony),
          api.query.encointerCeremonies.newbieCount(currentCommunityCeremony),
          api.query.encointerCeremonies.assignmentCounts(currentCommunityCeremony)
        ]);
        return [tempregisteredBootstrappers, tempregisteredReputables, tempregisteredEndorseees, tempregisteredNewbies, assignmentCounts]
      }

      let isMounted = true;
      getPhasepeopleData().then((data) => {
        if(isMounted){
        setregisteredBootstrappers(data[0]);
        setregisteredReputables(data[1]);
        setregisteredEndorsees(data[2]);
        setregisteredNewbies(data[3]);
        setunassignedNewbies(registeredNewbies-data[4].newbies);
        }
      })
      return () => {isMounted = false; }; 

    },[api, cid]);
    if(currentPhase==0){
      return (<div>
        <li>The registered Bootstrapper count is: {registeredBootstrappers.toString()}</li>
        <li>The registered Reputables count is: {registeredReputables.toString()}</li>
        <li>The registered Endorsees count is: {registeredEndorseees.toString()}</li>
        <li>The registered Newbies count is: {registeredNewbies.toString()}</li>
      </div>);
    }else{
      return (<div>
        <li>The registered Bootstrapper count is: {registeredBootstrappers.toString()}</li>
        <li>The registered Reputables count is: {registeredReputables.toString()}</li>
        <li>The registered Endorsees count is: {registeredEndorseees.toString()}</li>
        <li>The registered Newbies count is: {registeredNewbies.toString()}</li>
        <li color='red'>The number of unassigned Newbies is: {unassignedNewbies.toString()}</li>
      </div>);
    }
      
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
          <Icon name='money bill alternate' />
          <Header.Content>Currency info</Header.Content>
        </Header>
      </Segment>

      <Segment textAlign='center'>
        <Header sub textAlign='left'>Currency ID:</Header>
        <Message size='small' color='blue'>{hash}</Message>
        <p>{name}</p>
        <p>The nominal Income is:{nominalIncome}</p>
        <p>The date of the next Ceremony is: {nextMeetupTime}</p> 
      </Segment>

      <Segment textAlign='center'>
      {showPhasepeopleData()}
      </Segment>

      <Segment.Group>

        <Segment.Group horizontal>
          <Segment>
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
            <Header sub>tentative growth of Reputables:</Header>
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
          onClick={onClose} />
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
