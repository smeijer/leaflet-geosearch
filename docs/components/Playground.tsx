import React from 'react'
import { Playground, PlaygroundProps } from 'docz'
import styles from './Playground.module.css';


export default (props: PlaygroundProps) => {
  return (
    <div className={styles.root}>
      <Playground {...props} />
    </div>
  )
}

