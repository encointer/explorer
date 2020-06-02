import React from 'react';
import { Button, Menu } from 'semantic-ui-react';

export default function MapControl (props) {
  const { loading, onZoomIn, onZoomOut, onClick } = props;
  return (
    <Menu className='encointer-map-floating-widgets' stackable size='mini' vertical>
      <Menu.Item >
        <Button onClick={onClick} loading={loading} disabled={loading} icon='sidebar' className='encoiner-menu-button' />
      </Menu.Item>
      <Menu.Item >
        <Button.Group vertical compact size='small'>
          <Button icon='plus' onClick={onZoomIn}/>
          <Button icon='minus' onClick={onZoomOut}/>
        </Button.Group>
      </Menu.Item>
    </Menu>
  );
}
