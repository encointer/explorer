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
 * This is not intuitive.
 * See explanation https://polkadot.js.org/docs/api/start/api.query.other/#map-keys--entries.
 */
function extractAccountIdFromParticipantReputationMapKeys (keys) {
  return keys.map(({ args: [_cc, accountId] }) => accountId);
}

/**
 * This is a Component that shows the Meetup Date and Time
 */
export function ShowNextMeetupDate (props) {
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
 * This is a function that gets the Meetup Date and Time
 * This function can only be called in a useEffect Hook
 */
export async function getNextMeetupDate (api, cid) {
  const meetupLocations = await api.rpc.encointer.getLocations(cid);
  const tempLocation = locationFromJson(api, meetupLocations[0]);
  const tempTime = await getNextMeetupTime(api, tempLocation);
  if (!apiReady(api, 'encointerCeremonies')) {
    return;
  }
  return formatDate(tempTime.toNumber()).split(',')[0];
}

/**
* This is a Component that shows the relative tentative growth based on the current meetups registrations.
* Returns the max allowed growth if the number of registered newbies exceeds the allowed newbie seats.
*/
export function ShowTentativeGrowth (props) {
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
      return Math.round(((newbies.toNumber() + endorsees.toNumber()) / allReputableNumber) * 100);
    }

    getTentativeGrowth(allReputableNumber).then(data => {
      setTentativeGrowth(data);
    });
  }, [allReputableNumber, api, cid]);
  return tentativeGrowth;
}

/**
 * This is a function that gets the relative tentative growth based on the current meetups registrations.
 * Returns the max allowed growth if the number of registered newbies exceeds the allowed newbie seats.
 * This function can only be called in a useEffect Hook
 */
export async function getTentativeGrowth (allReputableNumber, api, cid) {
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

/**
 * This is a Component that shows the current number of Reputables in a given Community
 */
export function ShowReputableCount (props) {
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
        promises.push(
          api.query.encointerCeremonies.participantReputation.keys(communityCeremony)
            .then(extractAccountIdFromParticipantReputationMapKeys)
        );
      }

      const arrayOfReputablesArray = await Promise.all(promises);
      const arrayOfReputables = arrayOfReputablesArray.flat();

      // JSON.stringify is needed because objects are only equal if they point to the same reference.
      setAllReputableNumber([...new Set(arrayOfReputables.map((account) => JSON.stringify(account)))].length);
    }
    getReputableCount();
  }, [api, cid]);
  return allReputableNumber;
}

/**
 * This is a function that gets the reputable Count of a given Community
 * This function can only be called in a useEffect Hook
 */
export async function getReputableCount (api, cid) {
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
  return [...new Set(arrayOfReputables.map((account) => JSON.stringify(account)))].length;
}

/**
 * This is a Component that shows the Bootstrapper count, Reputable count, Endorsee count, Newbie count that registered for a Ceremony of a given Community.
 * The Assignment counts variable stores how many of them got assigned to a Ceremony
 */
export function ShowCurrentCeremonyRegistry (props) {
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
 * This is a function that gets the Bootstrapper count, Reputable count, Endorsee count, Newbie count that registered for a Ceremony of a given Community.
 * This function can only be called in a useEffect Hook
 * The returned Array has the following Ordering:
 * Bootstrapper
 * Reputables
 * Endorsees
 * Newbies
 * Assignment Count (from the various groups how many that registered for a ceremony actually got assigned)
 */
export async function getCurrentCeremonyRegistry (api, cid, currentPhase) {
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

/**
 * This is a Component that shows the Community Logo
 */
export function ShowCommunityLogo (props) {
  const { api, cid } = props;
  const [ipfsUrl, setIpfsUrl] = useState([]);
  useEffect(() => {
    async function getCommunityLogo () {
      if (!apiReady(api, 'encointerScheduler') || cid === undefined) {
        return;
      }
      const ipfsCidHex = (await api.query.encointerCommunities.communityMetadata(cid)).assets;
      const ipfsCid = ipfsCidFromHex(ipfsCidHex);

      setIpfsUrl('https://ipfs.io/ipfs/' + ipfsCid + '/community_icon.svg');
    }
    getCommunityLogo();
  }, [api, cid]);
  return <img src ={ipfsUrl} alt= ""/>;
}

/**
 * This is a Component that shows the nominal Income of a Community
 */
export function ShowNominalIncome (props) {
  const { api, cid } = props;
  const [nominalIncome, setNominalIncome] = useState([]);
  useEffect(() => {
    async function getNominalIncome () {
      if (!apiReady(api, 'encointerScheduler') || cid === undefined) {
        return;
      }
      const nominalIncome = await getCeremonyIncome(api, cid);
      return parseI64F64(nominalIncome);
    }
    getNominalIncome().then((income) => {
      setNominalIncome(income);
    });
  }, [api, cid]);
  return nominalIncome;
}

/**
 * This is a function that gets the nominal Income of a Community
 * This function can only be called in a useEffect Hook
 */
export async function getNominalIncome (api, cid) {
  if (!apiReady(api, 'encointerScheduler') || cid === undefined) {
    return;
  }
  const nominalIncome = await getCeremonyIncome(api, cid);
  return parseI64F64(nominalIncome);
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
      <Header sub>Number of attestation submissions: </Header>
      {submittedAttesters}
    </div>
  );
}
