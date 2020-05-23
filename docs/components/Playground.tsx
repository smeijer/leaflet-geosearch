import React from 'react';
import { Playground as DoczPlayground, PlaygroundProps } from 'docz';
import styles from './Playground.module.css';

function Playground(props: PlaygroundProps) {
  return (
    <div className={styles.root}>
      <DoczPlayground {...props} />
    </div>
  );
}

export default Playground;
