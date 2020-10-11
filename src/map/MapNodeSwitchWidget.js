import React, { useCallback, useMemo, useState } from 'react';
import { Button, Icon, Input, Sidebar, Radio, Segment } from 'semantic-ui-react';

export const CUSTOM_ENDPOINT_KEY = 'encointer-explorer-custom-endpoints';

function getCustomEndpoints () {
  try {
    const storedAsset = localStorage.getItem(CUSTOM_ENDPOINT_KEY);

    if (storedAsset) {
      return JSON.parse(storedAsset);
    }
  } catch (e) {
    console.error(e);
    // ignore error
  }

  return [];
}

function createOwn () {
  const items = getCustomEndpoints();
  return items.map((item) => ({
    info: 'local',
    text: 'Custom: '.concat(item),
    value: item
  }));
}

function createEndpoints () {
  return [
    {
      isHeader: true,
      text: 'Test networks',
      value: ''
    },
    // Hardcode default nodes for now
    {
      info: 'encointer',
      text: 'Gesell',
      icon: 'encointer-notee.svg',
      provider: 'Encointer Fundation',
      value: 'wss://gesell.encointer.org'
    },
    {
      info: 'encointer',
      text: 'Cantillon',
      icon: 'encointer-teeproxy.svg',
      provider: 'Encointer Fundation',
      value: 'wss://cantillon.encointer.org'
    },
    {
      isDevelopment: true,
      isHeader: true,
      text: 'Development',
      value: ''
    },
    {
      info: 'local',
      text: 'Local Node (Own, 127.0.0.1:9944)',
      value: 'ws://127.0.0.1:9944'
    },
    ...createOwn()
  ].filter(({ isDisabled }) => !isDisabled);
}

function combineEndpoints (endpoints) {
  return endpoints.reduce((result, e) => {
    if (e.isHeader) {
      result.push({ header: e.text, isDevelopment: e.isDevelopment, networks: [] });
    } else {
      const name = e.text;
      const prev = result[result.length - 1];
      const prov = { name: e.provider ? 'hosted by ' + e.provider : e.value, url: e.value };

      if (prev.networks[prev.networks.length - 1] && name === prev.networks[prev.networks.length - 1].name) {
        prev.networks[prev.networks.length - 1].providers.push(prov);
      } else {
        prev.networks.push({
          icon: e.icon,
          isChild: e.isChild,
          name,
          providers: [prov]
        });
      }
    }

    return result;
  }, []);
}

function Url ({ apiUrl, className, label, setApiUrl, url }) {
  const _setApiUrl = useCallback(
    () => setApiUrl(url),
    [setApiUrl, url]
  );

  return (
    <Radio
      className={className}
      label={label}
      onChange={_setApiUrl}
      checked={apiUrl === url}
    />
  );
}

function Network ({ apiUrl, className = '', setApiUrl, value: { icon, isChild, name, providers } }) {
  const isSelected = useMemo(
    () => providers.some(({ url }) => url === apiUrl),
    [apiUrl, providers]
  );

  const _selectFirst = useCallback(
    () => setApiUrl(providers[0].url),
    [providers, setApiUrl]
  );

  return (
    <div className={`endpoint-network ${className}${isSelected ? ' isSelected highlight--border' : ''}`}>
      <div
        className={`endpoint-section${isChild ? ' isChild' : ''}`}
        onClick={_selectFirst}
      >
        {icon ? <img className='endpoint-icon' alt='chain logo' src={'/'.concat(icon)} /> : null}
        <div className='endpoint-value'>{name}</div>
      </div>
      {isSelected && providers.map(({ name, url }): React.ReactNode => (
        <Url
          apiUrl={apiUrl}
          key={url}
          label={name}
          setApiUrl={setApiUrl}
          url={url}
          className='endpoint-address'
        />
      ))}
    </div>
  );
}

function GroupDisplay ({ apiUrl, children, className = '', index, isSelected, setApiUrl, setGroup, value: { header, networks } }) {
  const _setGroup = useCallback(
    () => setGroup(isSelected ? -1 : index),
    [index, isSelected, setGroup]
  );

  return (
    <Segment
      padded
      className={`${className}${isSelected ? ' isSelected' : ''}`}>
      <div
        className='groupHeader'
        onClick={_setGroup}
      >
        <Icon name={isSelected ? 'chevron up' : 'chevron down'} />
        {header}
      </div>
      {isSelected && (
        <>
          <div className='group-networks'>
            {networks.map((network, index): React.ReactNode => (
              <Network
                apiUrl={apiUrl}
                key={index}
                setApiUrl={setApiUrl}
                value={network}
              />
            ))}
          </div>
          {children}
        </>
      )}
    </Segment>
  );
}

function isValidUrl (url) {
  return (
    // some random length... we probably want to parse via some lib
    (url.length >= 7) &&
    // check that it starts with a valid ws identifier
    (url.startsWith('ws://') || url.startsWith('wss://'))
  );
}

export default function Endpoints (props) {
  const { socket, onClose, visible } = props;
  const linkOptions = createEndpoints();
  const [groups, setGroups] = useState(combineEndpoints(linkOptions));
  const extractUrlState = useCallback((apiUrl, groups) => {
    let groupIndex = groups.findIndex(({ networks }) =>
      networks.some(({ providers }) =>
        providers.some(({ url }) => url === apiUrl)
      )
    );

    if (groupIndex === -1) {
      groupIndex = groups.findIndex(({ isDevelopment }) => isDevelopment);
    }

    return {
      apiUrl,
      groupIndex,
      hasUrlChanged: socket !== apiUrl,
      isUrlValid: isValidUrl(apiUrl)
    };
  }, [socket]);
  const [{ apiUrl, groupIndex, hasUrlChanged, isUrlValid }, setApiUrl] = useState(extractUrlState(socket, groups));
  const [storedCustomEndpoints, setStoredCustomEndpoints] = useState(getCustomEndpoints());

  const isKnownUrl = useMemo(() => {
    let result = false;

    linkOptions.some((endpoint) => {
      if (endpoint.value === apiUrl) {
        result = true;

        return true;
      }

      return false;
    });

    return result;
  }, [apiUrl, linkOptions]);

  const isSavedCustomEndpoint = useMemo(() => {
    let result = false;

    storedCustomEndpoints.some((endpoint) => {
      if (endpoint === apiUrl) {
        result = true;

        return true;
      }

      return false;
    });

    return result;
  }, [apiUrl, storedCustomEndpoints]);

  const _changeGroup = useCallback(
    (groupIndex) => setApiUrl((state) => ({ ...state, groupIndex })),
    []
  );

  const _removeApiEndpoint = () => {
    if (!isSavedCustomEndpoint) return;

    const newStoredCurstomEndpoints = storedCustomEndpoints.filter((url) => url !== apiUrl);

    try {
      localStorage.setItem(CUSTOM_ENDPOINT_KEY, JSON.stringify(newStoredCurstomEndpoints));
      setGroups(combineEndpoints(createEndpoints()));
      setStoredCustomEndpoints(getCustomEndpoints());
    } catch (e) {
      console.error(e);
      // ignore error
    }
  };

  const _setApiUrl = useCallback(
    (apiUrl) => setApiUrl(extractUrlState(apiUrl, groups)),
    [extractUrlState, groups]
  );

  const _onChangeCustom = useCallback(
    e => {
      const apiUrl = e.target.value;
      setApiUrl(extractUrlState(apiUrl, groups));
    },
    [extractUrlState, groups]
  );

  const _onApply = useCallback(
    () => {
      window.location.assign(`${window.location.origin}${window.location.pathname}?rpc=${encodeURIComponent(apiUrl)}${window.location.hash}`);
      onClose();
    },
    [apiUrl, onClose]
  );

  const _saveApiEndpoint = () => {
    try {
      localStorage.setItem(CUSTOM_ENDPOINT_KEY, JSON.stringify([...storedCustomEndpoints, apiUrl]));
      _onApply();
    } catch (e) {
      console.error(e);
      // ignore error
    }
  };

  return (
    <Sidebar
      visible={visible}
      as={Segment.Group}
      className='node-switch-widget'
      onClose={onClose}
      position='left'
      vertical='true'
      width='wide'
      animation='overlay'
    >
      {groups.map((group, index) => (
        <GroupDisplay
          apiUrl={apiUrl}
          index={index}
          isSelected={groupIndex === index}
          key={index}
          setApiUrl={_setApiUrl}
          setGroup={_changeGroup}
          value={group}
        >
          {group.isDevelopment && (
            <div className='endpointCustomWrapper'>
              <div>Custom endpoint</div>

              <Input
                className='endpointCustom'
                error={!isUrlValid}
                onChange={_onChangeCustom}
                value={apiUrl}
                action={
                  isSavedCustomEndpoint
                    ? <Button onClick={_removeApiEndpoint}> <Icon name='trash alternate' /></Button>
                    : <Button onClick={_saveApiEndpoint} > <Icon name='save' /></Button>
                } />
            </div>
          )}
        </GroupDisplay>
      ))}

      <Segment className='node-switch-confirm'>
        <Button
          icon='sync'
          disabled={!(hasUrlChanged && isUrlValid)}
          positive={true}
          content="Switch"
          onClick={_onApply}
          fluid
        />
      </Segment>

      <Segment textAlign='left' className='node-switch-close'>
        <Button
          content='Close'
          labelPosition='left'
          icon='angle left'
          onClick={onClose}/>

      </Segment>
    </Sidebar>
  );
}
