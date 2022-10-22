import { useEffect, useState } from 'react';
import { locationFromJson } from './utils';
import { getNextMeetupTime } from '@encointer/node-api';

const apiReady = (api, queryName = '') => {
  const query = api && api.queryMulti && api.query;
  return query && queryName ? (!!query[queryName]) : !!query;
};
const formatDate = (timestamp) => (new Date(timestamp)).toLocaleString();

export function GetNextMeetupDate (props) {
  const { api, cid } = props;
  const [nextMeetupTime, setNextMeetupTime] = useState([]);
  if (!apiReady(api, 'encointerScheduler')) {
    return;
  }
  useEffect(() => {
    async function getNextMeetupDate () {
      const meetupLocations = await api.rpc.encointer.getLocations(cid);
      const tempLocation = locationFromJson(api, meetupLocations[0]);
      const tempTime = await getNextMeetupTime(api, tempLocation);
      setNextMeetupTime(formatDate(tempTime.toNumber()).split(',')[0]);
    }
    getNextMeetupDate();
  }, [api, cid]);

  return nextMeetupTime;
}

/**
* Gets the relative tentative growth based on the current meetups registrations.
* Returns the max allowed growth if the number of registered newbies exceeds the allowed newbie seats.
*/
export function GetTentativeGrowth (props) {
  const { allReputableNumber, api, cid } = props;
  const [tentativeGrowth, setTentativeGrowth] = useState([]);
  if (!apiReady(api, 'encointerScheduler')) {
    return;
  }
  useEffect(() => {
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
  return tentativeGrowth;
}
