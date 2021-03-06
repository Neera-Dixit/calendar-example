"use strict";

import React, {Component} from 'react';
import {Motion, spring} from 'react-motion';
import {Vertical, Row, Cell} from './calendar-utils';

class ViewDefault extends Component {
  constructor(props) {
    super(props)
    this.state = { width: this.props.width, height: this.props.height, cellClassName: "agenda-vertical" };
  }

  setDimension(width, height, cellClassName='') {
    this.setState({width, height, cellClassName});
  }

  prepareRender(withHour=false, withMinute=false) {
    let events
      , agenda = this.props.agenda
      , week = this.props.week
    if (this.props.agenda && this.props.events)
      events = agenda.tetris(agenda.getEvents(week, this.props.events, withHour, withMinute))
    let selection = {
      s: this.props.selectionStart.date,
      e: this.props.selectionEnd.date
    }
    return {events, week, selection}
  }

  toggleSelection(val) {
    this.props.toggleSelection(val)
  }
  moveSelection(val) {
    this.props.moveSelection(val)
  }
  onSelect(val) {
    this.props.onSelect(val)
  }
  onMouseDown(val) {
    this.props.toggleSelection({date: new Date(val.start)}, val)
    var eventListener = () => {
      this.props.toggleSelection()
      document.body.removeEventListener('mouseup',  eventListener);
    };
    document.body.addEventListener('mouseup',  eventListener);
  }

  getMoveUp() {
    return this.props.agenda.getMoveUp(4*this.props.height/(24*2))
  }

}

export class Week extends ViewDefault {
  componentDidMount() {
    this.setDimension(this.props.width/7, this.props.height/(24*2), "agenda-vertical")
  }
  componentWillReceiveProps(props) {
    this.setDimension(this.props.width/7, this.props.height/(24*2), "agenda-vertical")
  }

  style(evt, opacity=0.9) {
    let {room, cell} = evt
      , width = this.props.height/(24*2);
    return {
      opacity,
      left: (evt.cell.line + 1.5) * 18 + 'px',
      top: `${cell.start * width}px`,
      width: `${(cell.end - cell.start + 1) * width}px`,
      transform: 'rotate(90deg)',
      transformOrigin: 'left top 0',
      background: room.color||'grey'
    }
  }

  prepareProps(item, selection) {
    let agenda = this.props.agenda
      , cond = (item.date >= selection.s && item.date <= selection.e)
            || (!this.props.editor && this.props.current && agenda.compare(new Date(item.date), new Date(this.props.current.year, this.props.current.month, Math.abs(this.props.current.day), this.props.current.hour), true ) )
      , props = {
          value: item.minute ? "  " + item.minute : item.hour + "h ",
          className: cond ? "col-day col-day-active" : "col-day",
          toggleSelection: this.toggleSelection.bind(this, item),
          moveSelection: this.moveSelection.bind(this, item),
          disabled: item.disabled,
          key: `hour-${item.hour}-{item.minute}-${item.row}-${item.col}`
        }
    if (cond)
      props.color = this.props.selectionColor
    if (item.disabled) {
      delete props.toggleSelection;
      delete props.moveSelection;
      props.className = "col-day col-day-disabled";
    }
    return props;
  }

  render() {
    let {events, week, selection} = this.prepareRender(true, true)
    return (
      <Vertical className={this.state.cellClassName} style={{marginTop: this.getMoveUp()+"px"}}>
        {week.map(item => <Cell {...this.prepareProps(item, selection)} {...this.state} /> )}
        <Events events={events} style={this.style.bind(this)}
                onMouseDown={this.onMouseDown.bind(this)}
                onClick={this.onSelect.bind(this)} />
      </Vertical>
    )
  }
}

export class Day extends Week {
  componentDidMount() {
    this.setDimension(this.props.width, this.props.height/(24*2), "agenda-vertical agenda-vertical-row")
  }
  componentWillReceiveProps(props) {
    this.setDimension(this.props.width, this.props.height/(24*2), "agenda-vertical agenda-vertical-row")
  }

  style(evt, opacity) {
    let eventWidth = 180
      , {room, cell} = evt
      , width = this.props.height/(24*2);
    return {
      opacity,
      top: `${cell.start * width}px`,
      left: (evt.cell.line - 0.5) * eventWidth + 'px',
      height: `${(cell.end - cell.start + 1) * width}px`,
      width: eventWidth + 'px',
      background: room.color||'grey'
    }
  }
}

export class Month extends ViewDefault {
  componentDidMount() {
    this.setDimension(this.props.width/7, this.props.height/7)
  }
  componentWillReceiveProps(props) {
    this.setDimension(this.props.width/7, this.props.height/7)
  }

  style(evt, opacity=0.9) {
    let {room, cell} = evt
      , width = this.state.width
    return {
      opacity,
      top: (evt.cell.line + 0.5) * 12 + 'px',
      left: `${cell.start * width}px`,
      width: `${(cell.end - cell.start + 1) * width}px`,
      background: room.color||'grey'
    }
  }

  prepareProps(item, selection) {
    let agenda = this.props.agenda
      , cond = (item.date >= selection.s && item.date <= selection.e)
                || (!this.props.editor && this.props.current && agenda.compare(new Date(item.date), new Date(this.props.current.year, this.props.current.month, Math.abs(this.props.current.day)) ) )
      , props = {
        value: item.day,
        className: cond ? "col col-active" : "col",
        toggleSelection: this.toggleSelection.bind(this, item),
        moveSelection: this.moveSelection.bind(this, item),
        disabled: item.disabled,
        key: `day-${item.day}-${item.col}-${item.row}`
      }
    if (cond) {
      props.color = this.props.selectionColor
    }
    if (item.disabled) {
      delete props.toggleSelection;
      delete props.moveSelection;
      props.className = "col-day col-day-disabled";
    }
    return props;
  }

  render() {
    let {events, week, selection} = this.prepareRender()
    return (
      <Row>
        {week.map(item => <Cell {...this.prepareProps(item, selection)} {...this.state} /> )}
        <Events events={events} style={this.style.bind(this)}
                onMouseDown={this.onMouseDown.bind(this)}
                onClick={this.onSelect.bind(this)} />
      </Row>
    )
  }
}


class Events extends Component {
  constructor(props) {
    super(props)
    this.state = { phase: null }
    this.interval = null;
  }
  onClick(evt, e) {
    e.preventDefault()
    clearTimeout(this.interval)
    if (this.state.phase === null)
      this.props.onClick(evt)
    else
      this.setState({phase: null})
  }
  onMouseDown(evt, e) {
    e.preventDefault()
    this.interval = setTimeout(() => {
      this.props.onMouseDown(evt)
      this.setState({phase: 'down'})
    }, 500)
  }

  render() {
    let events = this.props.events||[]
    return (<div className="events">
      {events && events.map((evt, i) =>
        <div className="event"
              style={this.props.style(evt)}
              onMouseDown={this.onMouseDown.bind(this, evt)}
              onClick={this.onClick.bind(this, evt)} key={`event-${i}`}>{evt.title}</div>
      )}
    </div>)
  }
}


