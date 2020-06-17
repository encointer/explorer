import React from 'react';
import { Sidebar, Menu, Icon } from 'semantic-ui-react';

function MapMenuMain (props) {
  return (
    <Sidebar
      as={Menu}
      animation='overlay'
      direction='left'
      icon='labeled'
      inverted
      vertical
      visible={props.visible}
      width='thin'
    >

      <Menu.Item as='a' href='//encointer.org' target='_blank'>
        <Icon name='book' />
            Documentation
      </Menu.Item>

      <Menu.Item as='a' href='//encointer.org/testnet/' target='_blank' >
        <Icon name='block layout' />
            Testnet
      </Menu.Item>

      <Menu.Item as='a' href='//encointer.org/blog/' target='_blank'>
        <Icon name='newspaper' />
            Blog
      </Menu.Item>

      <Menu.Item as='a' href='//encointer.org/faq/' target='_blank'>
        <Icon name='question circle' />
            FAQ
      </Menu.Item>

      <Menu.Item as='a' href='//encointer.org/donate/' target='_blank'>
        <Icon name='dollar' />
           Donate
      </Menu.Item>

      <Menu.Item as='a' href='//encointer.org/about/' target='_blank'>
        <Icon name='favorite' />
           About
      </Menu.Item>

      <Menu.Item as='a' href='//github.com/encointer/encointer-node' target='_blank'>
        <Icon name='github' />
            Code
      </Menu.Item>

    </Sidebar>
  );
}

export default React.memo(MapMenuMain, (prev, cur) => prev.visible === cur.visible);
