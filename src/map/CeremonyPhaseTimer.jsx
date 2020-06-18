import React, { useEffect, useState } from 'react';

const phaseTimestampToTimer = (timestamp) => {
  const timeSec = ((timestamp - Date.now()) / 1000) | 0;
  if (timeSec >= 0) {
    const seconds = timeSec % 60;
    let minutes = (timeSec / 60) | 0;
    let hours = minutes / 60 | 0;
    const days = hours / 24 | 0;
    if (hours > 0) {
      minutes = minutes % 60;
    }
    if (days > 0) {
      hours = hours % 24;
    }
    const daysStr = days ? days.toString().concat('d ') : '';
    const hoursStr = hours.toString().padStart(2, '0');
    const minutesStr = minutes.toString().padStart(2, '0');
    const secondsStr = seconds.toString().padStart(2, '0');
    return `${daysStr}${hoursStr}:${minutesStr}:${secondsStr}`;
  } else {
    return 'finished';
  }
};

export function CeremonyPhaseTimer (props) {
  const { nextPhaseTimestamp } = props;
  const [timer, setTimer] = useState('');

  useEffect(() => {
    setTimer(phaseTimestampToTimer(nextPhaseTimestamp));
    const id = setInterval(() => {
      setTimer(phaseTimestampToTimer(nextPhaseTimestamp));
    }, 1000);
    return () => clearInterval(id);
  }, [nextPhaseTimestamp]);

  return <React.Fragment>{timer}</React.Fragment>;
}
