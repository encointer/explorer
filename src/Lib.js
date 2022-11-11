import React, { useEffect, useState } from 'react';
import { locationFromJson, ipfsCidFromHex } from './utils';
import { getNextMeetupTime, getCeremonyIncome } from '@encointer/node-api';
import { parseI64F64 } from '@encointer/util';
import { Header } from 'semantic-ui-react';

const apiReady = (api, queryName = '') => {
  const query = api && api.queryMulti && api.query;
  return query && queryName ? (!!query[queryName]) : !!query;
};
const formatDate = (timestamp) => (new Date(timestamp)).toLocaleString();

/**
 * Gets the Meetup Date and Time and returns it
 */
export function GetNextMeetupDate (props) {
  const { api, cid } = props;
  const [nextMeetupTime, setNextMeetupTime] = useState([]);
  useEffect(() => {
    async function getNextMeetupDate () {
      const meetupLocations = await api.rpc.encointer.getLocations(cid);
      const tempLocation = locationFromJson(api, meetupLocations[0]);
      const tempTime = await getNextMeetupTime(api, tempLocation);
      setNextMeetupTime(formatDate(tempTime.toNumber()).split(',')[0]);
    }
    getNextMeetupDate();
  }, [api, cid]);
  if (!apiReady(api, 'encointerCeremonies')) {
    return;
  }
  return nextMeetupTime;
}

/**
* Gets the relative tentative growth based on the current meetups registrations.
* Returns the max allowed growth if the number of registered newbies exceeds the allowed newbie seats.
*/
export function GetTentativeGrowth (props) {
  const { allReputableNumber, api, cid } = props;
  const [tentativeGrowth, setTentativeGrowth] = useState([]);
  useEffect(() => {
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
      return (Math.round(((newbies.toNumber() + endorsees.toNumber()) / allReputableNumber) * 100) / 100);
    }

    getTentativeGrowth(allReputableNumber).then(data => {
      setTentativeGrowth(data);
    });
  }, [allReputableNumber, api, cid]);
  return tentativeGrowth;
}

/**
 * gets the current number of Reputables
 */
export function GetReputableCount (props) {
  const { api, cid } = props;
  const [allReputableNumber, setAllReputableNumber] = useState([]);
  useEffect(() => {
    async function getReputableCount () {
      const CommunityCeremony = api.registry.getOrUnknown('CommunityCeremony');
      const [reputationLifetime, currentCeremonyIndex] = await Promise.all([
        api.query.encointerCeremonies.reputationLifetime(),
        api.query.encointerScheduler.currentCeremonyIndex()
      ]);

      const promises = [];
      const lowerIndex = Math.max(0, currentCeremonyIndex - reputationLifetime);

      for (let cIndex = lowerIndex; cIndex <= currentCeremonyIndex; cIndex++) {
        const communityCeremony = new CommunityCeremony(api.registry, [cid, cIndex]);
        promises.push(api.query.encointerCeremonies.participantReputation.keys(communityCeremony));
      }
      const arrayOfReputablesArray = await Promise.all(promises);

      // reduce the array of arrays to a single set.
      const allReputablesSet = new Set(arrayOfReputablesArray.reduce((all, nextArray) => [...all, ...nextArray]));

      setAllReputableNumber(allReputablesSet.size);
    }
    getReputableCount();
  }, [api, cid]);
  return allReputableNumber;
}

/**
 * Gets the Bootstrapper count, Reputable count, Endorsee count, Newbie count that registered for a Ceremony
 * The Assignment counts variable stores how many of them got assigned to a Ceremony
 */
export function GetCurrentCeremonyRegistry (props) {
  const { api, cid, currentPhase } = props;
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
  }, [api, cid, currentPhase]);
  return (currentPhase.phase === 0)
    ? getRegisteredParticipantsComponent(ceremonyRegistry)
    : getAssignedParticipantsComponent(ceremonyRegistry);
}

/**
 * Gets the Community Logo
 */
export function GetCommunityLogo (props) {
  const { api, cid } = props;
  const [ipfsUrl, setIpfsUrl] = useState([]);
  useEffect(() => {
    async function getCommunityLogo () {
      const ipfsCidHex = (await api.query.encointerCommunities.communityMetadata(cid)).assets;
      const ipfsCid = ipfsCidFromHex(ipfsCidHex);

      setIpfsUrl('https://ipfs.io/ipfs/' + ipfsCid + '/community_icon.svg');
    }
    getCommunityLogo();
  }, [api, cid]);
  return <img src ={ipfsUrl} alt= ""/>;
}
/**
 * gets the nominal Income of a Community
 */
export function GetNominalIncome (props) {
  const { api, cid } = props;
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
  return nominalIncome;
}

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

export function ShowNumberOfSubmittedAttesters (props) {
  const { api, cid } = props;
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

  return showNumberOfSubmittedAttesters(submittedAttesters, setSubmittedAttesters);
}

function showNumberOfSubmittedAttesters (submittedAttesters, setSubmittedAttesters) {
  if (submittedAttesters === null) {
    setSubmittedAttesters(0);
  }
  return (
    <div>
      <Header sub>Assigned Participants for this ceremony: </Header>
      {submittedAttesters}
    </div>
  );
}
