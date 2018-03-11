import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React from 'react';
import ReactTooltip from 'react-tooltip';
import '../App.css';

let shittyCurrier = {};

class Filter extends React.Component {
  constructor(props) {
    super(props);
    this.on_filter_select = this.on_filter_select.bind(this);
    this.on_filter_change = this.on_filter_change.bind(this);
    this.toggle_on = this.toggle_on.bind(this);
    this.toggle_off = this.toggle_off.bind(this);
    this.on_slider_change = this.on_slider_change.bind(this);
    this.reset = this.reset.bind(this);
  }

  reset() {
    this.props.resetAll();
  }

  toggle_on() {
    const filter = this.props.filters.get(this.props.selected_filter).values;
    for (let k of filter.keys()) {
      filter.set(k, true);
    }
    shittyCurrier = this.props.filters;
    this.props.onFilterChange();
  }

  toggle_off() {
    const filter = this.props.filters.get(this.props.selected_filter).values;
    for (let k of filter.keys()) {
      filter.set(k, false);
    }
    shittyCurrier = this.props.filters;
    this.props.onFilterChange();
  }

  on_filter_select(event) {
    shittyCurrier = event.target.value;
    this.props.onFilterSelect();
  }

  on_filter_change(event) {
    const sf = this.props.selected_filter;
    const v = event.target.value;
    this.props.filters
      .get(sf).values
      .set(v, !this.props.filters.get(sf).values.get(v));
    shittyCurrier = this.props.filters;
    this.props.onFilterChange();
  }

  on_slider_change(event) {
    event.persist();
    const f = this.props.filters.get(this.props.selected_filter);
    f['slider_' + event.target.id] = parseFloat(event.target.value, 10);
    if (f.slider_max < f.slider_min) {
      if (event.target.id === 'min') {
        f.slider_max = f.slider_min;
      } else {
        f.slider_min = f.slider_max;
      }
    }
    shittyCurrier = this.props.filters;
    this.props.onFilterChange();
  }

  render_filterable_attributes() {
    return (
      <select
          value={this.props.selected_filter}
          onChange={this.on_filter_select}>
        {Array.from(this.props.filters.keys()).map((name, i) => {
          return <option key={i} value={name}>{name}</option>;
        })}
      </select>
    );
  }

  render_radio() {
    const f = this.props.filters.get(this.props.selected_filter);
    return (
      <form style={{overflowY: 'scroll', height: this.props.height * 0.7}}>
        {Array.from(f.values.keys())
          .sort((a, b) => a > b ? 1 : -1)
          .map((k, i) => {
            return (
              <div key={i}>
                <label>
                  <input
                    type="radio"
                    value={k}
                    onClick={this.on_filter_change}
                    checked={f.values.get(k)}
                  />
                  {k}
                </label>
              </div>
            );
        })}
      </form>
    );
  }

  render_num_filter() {
    const f = this.props.filters.get(this.props.selected_filter);
    return (
      <div>
        <div>
          <div>Max {f.slider_max}</div>
          <input
            type="range"
            id="max"
            ref="max"
            min={f.min}
            max={f.max}
            defaultValue={f.slider_max}
            value={f.slider_max}
            onChange={this.on_slider_change}
          />
        </div>
        <div>
          <div>Min {f.slider_min}</div>
          <input
            id="min"
            ref="max"
            type="range"
            min={f.min}
            max={f.max}
            defaultValue={f.slider_min}
            value={f.slider_min}
            onChange={this.on_slider_change}
          />
        </div>
      </div>
    );
  }

  render() {
    return (
      <div>
        <br/>
        <button onClick={this.reset}>Reset Every Filter</button>
        <br/>
        <br/>
        <a data-tip={"Every attribute that you can filter in/out and stuff."}>
          Filterable Attribues
        </a>
        <ReactTooltip place="top" type="dark" effect="float"/>
        {this.props.filters ? this.render_filterable_attributes() : <div/>}
        <br/>
        {this.props.filters && this.props.selected_filter
          ? !this.props.filters.get(this.props.selected_filter).is_num
            ? (
                <div>
                  <button onClick={this.toggle_on}>
                    Toggle All On
                  </button>
                  <button onClick={this.toggle_off}>
                    Toggle All Off
                  </button>
                 {this.render_radio()}
               </div>
              )
            : this.render_num_filter()
          : <div/>
        }
      </div>
    );
  }
}

Filter.propTypes = {
  onFilterSelect: PropTypes.func.isRequired,
  onFilterChange: PropTypes.func.isRequired,
};

Filter.defaultProps = {
};

const mapStateToProps = ({ store }) => ({
  ...store,
});

const mapDispatchToProps = dispatch => ({
  onFilterSelect: () => dispatch({
    type: 'FILTER_SELECT',
    payload: shittyCurrier,
  }),
  onFilterChange: () => dispatch({
    type: 'FILTER_CHANGE',
    payload: shittyCurrier,
  }),
  resetAll: () => dispatch({
    type: 'RESET_FILTER',
  })
});

export default connect(mapStateToProps, mapDispatchToProps)(Filter);
