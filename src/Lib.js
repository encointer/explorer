import React,{useEffect, useState} from "react";
import { locationFromJson } from "./utils";
import { getNextMeetupTime } from "@encointer/node-api";

const apiReady = (api, queryName = '') => {
    const query = api && api.queryMulti && api.query;
    return query && queryName ? (!!query[queryName]) : !!query;
};
const formatDate = (timestamp) => (new Date(timestamp)).toLocaleString();






export function getNextMeetupDate(api, cid){

  
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
      },[api,cid]);
  
return nextMeetupTime;
}


//const { api, apiState, socket } = useSubstrate();

export function Printfunnystuff(api){
  if(apiReady(api, 'encointerScheduler')){
    console.log("this thing works as it is planned")
  }
  
  console.log("ldafjksjffjfjfjfjfjfj heeeeeeeeeeyyyyyyyyyyyyyyyyyyyyyyyaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa!!");
  
}
export function doreturn(){
  
  return 2;
}

  //useEffect(() => {
    /**
     * Gets the relative tentative growth based on the current meetups registrations.
     * Returns the max allowed growth if the number of registered newbies exceeds the allowed newbie seats.
     */
    /*async function getTentativeGrowth (allReputableNumber) {
      const meetupNewbieLimitDivider = api.consts.encointerCeremonies.meetupNewbieLimitDivider;
      const currentCeremonyIndex = await api.query.encointerScheduler.currentCeremonyIndex();
      const currentCommunityCeremony = new CommunityCeremony(api.registry, [cid, currentCeremonyIndex]);
      const newbies = await api.query.encointerCeremonies.newbieCount(currentCommunityCeremony);
      
      const maxGrowthAbsolute = Math.min(
        newbies,
        Math.floor(allReputableNumber / meetupNewbieLimitDivider)
      );

      // round to 2 digits
      return (allReputableNumber != null) ? Math.round(maxGrowthAbsolute / allReputableNumber * 100) / 100 : null;
    }
    let isMounted = true;
    if (allReputableNumber) {
      getTentativeGrowth(allReputableNumber).then(data => {
        if (isMounted) setTentativeGrowth(data);
      });
      return () => { isMounted = false; };
    }
    }   , []);*/















