import React from 'react';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';

const CommunityBusinessSwitch = (props) => {
  // Our States
  const [state, setState] = React.useState({ status: true });

  // Change State Function
  const handleChange = (event) => {
    setState({ ...state, [event.target.name]: event.target.checked });
  };

  return (
      <div style={{
        margin: 'auto',
        display: 'block',
        width: 'fit-content'
      }}>
          <h3>How to use Switch Component in ReactJS?</h3>
          <FormControlLabel
              control={
                   <Switch
                      checked={state.status}
                      onChange={handleChange}
                      color="primary"
                      name="status"
                  />
              }
              label="Switch Silent Mode"
          />
      </div>
  );
};

export default CommunityBusinessSwitch;
