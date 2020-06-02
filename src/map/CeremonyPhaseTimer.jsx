import React, { useEffect, useState } from 'react';

const phaseTimestampToTimer = (timestamp) => {
  const timeSec = ((timestamp - Date.now()) / 1000) | 0;
  if (timeSec >= 0) {
    return `${((timeSec / 60) | 0).toString().padStart(2, '0')}:${(timeSec % 60).toString().padStart(2, '0')}`;
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
