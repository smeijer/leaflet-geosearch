/* eslint-disable react/prop-types */
import React from 'react';
import * as headings from 'gatsby-theme-docz/src/components/Headings';
import { Link } from 'docz';
import { Code } from 'gatsby-theme-docz/src/components/Code';
import { Layout } from 'gatsby-theme-docz/src/components/Layout';
import { Playground } from 'gatsby-theme-docz/src/components/Playground';
import { Pre } from 'gatsby-theme-docz/src/components/Pre';
import { Props as BaseProps } from 'gatsby-theme-docz/src/components/Props';
import styles from './custom.module.css';

// use client side router for local links
const a = (props) =>
  props.href.startsWith('http://') || props.href.startsWith('https://') ? (
    <a {...props} target="_blank" rel="noreferrer nofollow">
      {props.children}
    </a>
  ) : (
    <Link to={props.href}>{props.children}</Link>
  );

// reformat props table
// this could be even better, but we need to override some defaults components
// see for inspiration, see  https://github.com/storybookjs/storybook/issues/9395
const Props = ({ props, ...rest }) => {
  Object.keys(props).forEach((key) => {
    const type = props[key].type;
    type.name = type.name
      .replace(/\| undefined$/, '')
      .replace(/"/g, "'")
      .replace();

    if (type.name[0] === '(' && type.name[type.name.length - 1] === ')') {
      type.name = type.name.substr(1, type.name.length - 2);
    }
  });

  return (
    <div className={styles.props}>
      <BaseProps {...rest} props={props} />
    </div>
  );
};

export default {
  ...headings,
  code: Code,
  a,
  playground: Playground,
  pre: Pre,
  layout: Layout,
  props: Props,
};
