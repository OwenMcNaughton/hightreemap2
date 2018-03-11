import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React from 'react';
import ReactTooltip from 'react-tooltip';
import '../App.css';

let shittyCurrier = {};

class Colorizer extends React.Component {
  constructor(props) {
    super(props);
    this.on_cg_change = this.on_cg_change.bind(this);
    this.add_gradient = this.add_gradient.bind(this);
    this.remove_gradient = this.remove_gradient.bind(this);
    this.on_colorer_select = this.on_colorer_select.bind(this);
    this.on_pct_str_change = this.on_pct_str_change.bind(this);
    this.on_pcts_col_change = this.on_pcts_col_change.bind(this);
  }

  on_pcts_col_change(event, which) {
    shittyCurrier = {
      start: which == 'start' ? event.target.value : this.props.pct_col_start,
      end: which == 'end' ? event.target.value : this.props.pct_col_end,
      str: this.props.pct_str,
    };
    this.props.onPctChange();
  }

  on_pct_str_change(event) {
    shittyCurrier = {
      start: this.props.pct_col_start,
      end: this.props.pct_col_end,
      str: event.target.value,
    };
    this.props.onPctChange();
  }

  on_cg_change(event, idx, name) {
    this.props.gradients[idx][name] = event.target.value;
    shittyCurrier = this.props.gradients;
    this.props.onGradientsChange();
  }

  on_colorer_select(event) {
    shittyCurrier = event.target.value;
    this.props.onColorerChange();
  }

  render_gradient_card(cg, i) {
    return (
      <div>
        <input
          type="text"
          value={cg.domain_start}
          onChange={event => { this.on_cg_change(event, i, 'domain_start')}}
          size="6"
        />
        ->
        <input
          type="text"
          value={cg.domain_end}
          onChange={event => { this.on_cg_change(event, i, 'domain_end')}}
          size="6"
        />
        <br/>
        <input
          type="text"
          value={cg.color_start}
          onChange={event => { this.on_cg_change(event, i, 'color_start')}}
          size="6"
        />
        ->
        <input
          type="text"
          value={cg.color_end}
          onChange={event => { this.on_cg_change(event, i, 'color_end')}}
          size="6"
        />
        <br/>
        <button onClick={_ => { this.remove_gradient(i) }}>
          Remove gradient
        </button>
        <br/>
      </div>
    );
  }

  make_tooltip(cg) {
    if (cg.color_end === cg.color_start) {
      return 'Entities with a ' + this.props.selected_filter + ' value ' +
        'between ' + cg.domain_start + ' and ' + cg.domain_end + ' will be ' +
        cg.color_end;
    } else {
      return 'Entities with a ' + this.props.selected_filter + ' value ' +
        'between ' + cg.domain_start + ' and ' + cg.domain_end + ' will be ' +
        'on a gradient between ' + cg.color_start + ' and ' + cg.color_end;
    }
  }

  add_gradient() {
    this.props.gradients.push(
      {'domain_start': 0, 'domain_end': 0,
       'color_start': 'white', 'color_end': 'white'}
    );
    shittyCurrier = this.props.gradients;
    this.props.onGradientsChange();
  }

  remove_gradient(idx) {
    this.props.gradients.splice(idx, 1);
    shittyCurrier = this.props.gradients;
    this.props.onGradientsChange();
  }

  render_colorable_attributes() {
    const filters = this.props.filters ? this.props.filters : [];
    return (
      <select
          value={this.props.colorer}
          onChange={this.on_colorer_select}>
        {Array.from(filters.keys())
          .filter((k, i) => {
            return filters.get(k).is_num;
          })
          .map((name, i) => {
            return <option key={i} value={name}>{name}</option>;
          })
        }
      </select>
    );
  }

  render_percentile_colorizer() {
    return (
      <div>
        <div
          data-for="path"
          data-tip={
            "Enter comma-separated numbers between 0 and 100. <br/>" +
            "For example, if you enter 25,75, then all entities with a <br/>" +
            this.props.colorer + " value in the bottom 25% of values " +
            "will be " + this.props.pct_col_start + ", <br/> and entities " +
            "with a " + this.props.colorer + " value in the top 75% " +
            "will be <br/>" + this.props.pct_col_end + " and everything " +
            "located between 25% and 75% <br/> of the range will " +
            "have a color somewhere in-between."

          }
        >
          Generate By Percentiles
          <input
            type="text"
            value={this.props.pct_str}
            onChange={event => { this.on_pct_str_change(event)}}
            size="12"
            placeholder="5,25,50,75,95"
          />
          <br/>
          <input
            type="text"
            value={this.props.pct_col_start}
            onChange={event => { this.on_pcts_col_change(event, 'start')}}
            size="6"
          />
          ->
          <input
            type="text"
            value={this.props.pct_col_end}
            onChange={event => { this.on_pcts_col_change(event, 'end')}}
            size="6"
          />
        </div>
        <ReactTooltip id="path" place="top" effect="float" multiline={true}/>
      </div>
    );
  }

  render() {
    const cgs = this.props.gradients || [];
    const colorizer = this;
    const height = this.props.height ? this.props.height * 0.6 : 400;
    return (
      <div>
        Color by:
        {this.render_colorable_attributes()}
        <br/>
        <br/>
        {this.render_percentile_colorizer()}
        <br/>
        Gradients
        <div style={{'overflowY': 'scroll', 'height': height}}>
          {Array.from(cgs)
            .map((cg, i) => {
              return (
                <div key={i}>
                  <div data-tip={colorizer.make_tooltip(cg)}>
                    {colorizer.render_gradient_card(cg, i)}
                  </div>
                  <ReactTooltip place="right" type="dark" effect="float"/>
                  <br/>
                </div>
              );
            })}
          <button onClick={this.add_gradient}>
            Add gradient
          </button>
        </div>
      </div>
    );
  }
}

Colorizer.propTypes = {
  onGradientsChange: PropTypes.func.isRequired,
};

Colorizer.defaultProps = {
};

const mapStateToProps = ({ store }) => ({
  ...store,
});

const mapDispatchToProps = dispatch => ({
  onGradientsChange: () => dispatch({
    type: 'GRADIENTS_CHANGE',
    payload: shittyCurrier,
  }),
  onColorerChange: () => dispatch({
    type: 'COLORER_CHANGE',
    payload: shittyCurrier,
  }),
  onPctChange: () => dispatch({
    type: 'PCT_CHANGE',
    payload: shittyCurrier,
  })
});

export default connect(mapStateToProps, mapDispatchToProps)(Colorizer);
