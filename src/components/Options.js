import Colorizer from './Colorizer.js';
import { connect } from 'react-redux';
import Filter from './Filter.js';
import PropTypes from 'prop-types';
import React from 'react';
import TreeStructure from './TreeStructure.js';


function style(props) {
  return Object.assign({
    'position': 'absolute',
    'width': '100%',
    'height': '100%',
    'textAlign': 'center',
  }, {
    'width': props.opts_width || 0,
    'height': props.height || 0,
    'backgroundColor': '#eee',
  });
}

let shittyCurrier = {};

class Options extends React.Component {
  constructor(props) {
    super(props);
    this.on_pane_select = this.on_pane_select.bind(this);
  }

  on_pane_select(event) {
    shittyCurrier = event.target.value;
    this.props.onPaneSelect();
  }

  render() {
    let pane = <div/>;
    switch (this.props.selected_pane) {
      case 'Tree Structure':
        pane = <TreeStructure tree_structure={this.props.tree_structure}/>;
        break;
      case 'Filter':
        pane = <Filter
          sig={this.props.sig}
          selected_filter={this.props.selected_filter}
          filters={this.props.filters}
        />;
        break;
      case 'Colorizer':
        pane = <Colorizer
          sig={this.props.sig}
          entities={this.props.filtered_entities}
          gradients={this.props.gradients}
          selected_filter={this.props.selected_filter}
          filters={this.props.filters}
          colorer={this.props.colorer}
          pct_str={this.props.pct_str}
          pct_col_start={this.props.pct_col_start}
          pct_col_end={this.props.pct_col_end}
        />;
        break;
    }
    return (
      <div style={style(this.props)}>
        <select value={this.props.selected_pane} onChange={this.on_pane_select}>
          <option value="Tree Structure">Tree Structure</option>
          <option value="Filter">Filter</option>
          <option value="Colorizer">Colorizer</option>
        </select>
        <br/>
        <br/>
        {pane}
      </div>
    )
  }
}

Options.propTypes = {
  onPaneSelect: PropTypes.func.isRequired,
};

Options.defaultProps = {
  selected_pane: 'Colorizer',
};

const mapStateToProps = ({ store }) => ({
  ...store,
});

const mapDispatchToProps = dispatch => ({
  onPaneSelect: () => dispatch({
    type: 'PANE_SELECT',
    payload: shittyCurrier,
  })
});

export default connect(mapStateToProps, mapDispatchToProps)(Options);
