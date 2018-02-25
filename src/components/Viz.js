import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React from 'react';
import Options from './Options.js';


function style(props) {
  return Object.assign({
    'position': 'absolute',
  }, {
    'width': props.viz_width || 0,
    'height': props.height || 0,
    'left': props.opts_width || 0,
  });
}

let shittyCurrier = {};

class Viz extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    shittyCurrier = {vizdiv: this.refs.vizdiv};
    this.props.onWindowUpdate();
    window.addEventListener(
      'resize', this.props.onWindowUpdate);
    window.addEventListener(
      'resize', this.props.onUpdateStructure);
  }

  componentWillUnmount() {
    window.removeEventListener(
      'resize', this.props.onWindowUpdate);
  }

  render() {
    return (
      <div>
        <div style={style(this.props)} ref="vizdiv">

        </div>
        <div>
          <Options/>
        </div>
      </div>
    )
  }
}

Viz.propTypes = {
  hello: PropTypes.string,
  onWindowUpdate: PropTypes.func.isRequired,
  onUpdateStructure: PropTypes.func.isRequired,
};

Viz.defaultProps = {
  hello: 'arse',
};

const mapStateToProps = ({ store }) => ({
  ...store,
});

const mapDispatchToProps = dispatch => ({
  onWindowUpdate: () => dispatch({
    type: 'WINDOW_UPDATE',
    payload: shittyCurrier,
  }),
  onUpdateStructure: () => dispatch({
    type: 'UPDATE_STRUCTURE',
    payload: shittyCurrier,
  })
});

export default connect(mapStateToProps, mapDispatchToProps)(Viz);
