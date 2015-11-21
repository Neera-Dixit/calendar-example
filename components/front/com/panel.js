"use strict";

import React, {Component} from 'react';


export default class extends Component {
  constructor(props) {
    super(props)
  }

  render() {
    return (
      <div className="agenda-panel">
        {Object.keys(this.props).map(key => <div>{this.props[key].toString()}</div>)}
      </div>
    )
  }
}
