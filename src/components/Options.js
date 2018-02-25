import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

function style(props) {
  return Object.assign({
    'position': 'absolute',
    'width': '100%',
    'height': '100%',
  }, {
    'width':  props.opts_width || 0,
    'height': props.height || 0,
    'backgroundColor': props.color || 'blue',
  });
}

class Options extends React.Component {
  render() {
    return (
      <div style={style(this.props)}>
        aaddss
      </div>
    )
  }
}

Options.propTypes = {
  hello: PropTypes.string,
  onUpdateStructure: PropTypes.func.isRequired,
};

Options.defaultProps = {
  hello: 'arse',
};

const mapStateToProps = ({ store }) => ({
  ...store,
});

const mapDispatchToProps = dispatch => ({
  onUpdateStructure: () => dispatch({
    type: 'UPDATE_STRUCTURE',
    payload: { direction: -1 },
  })
});

export default connect(mapStateToProps, mapDispatchToProps)(Options);
