import newStore from './newStore';
import { OPTS_RATIO } from '../constants';
import { pokemon } from '../pokemon';
import TreeMap from '../components/TreeMap'

function rstr() {
  var text = "";
  var p = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 5; i++)
    text += p.charAt(Math.floor(Math.random() * p.length));

  return text;
}

function rcolor() {
  var p = ['cornflowerblue', 'darkgoldenrod', 'aqua', 'firebrick', 'darksalmon',
           'lavender', 'khaki', 'ivory'];
  return p[Math.floor(Math.random() * p.length)];
}

const reducers = {
  WINDOW_UPDATE: (state, action) => {
    const viz_width = window.innerWidth
      ? window.innerWidth * (1 - OPTS_RATIO) : 0;
    const height = window.innerHeight || 0;
    let items = [];
    // for (let i = 0; i != 10000; i++) {
    //   items.push({name: rstr(), type: rcolor(), type2: rcolor(), type3: rcolor()})
    // }
    items = pokemon;
    this.treemap = new TreeMap(
      items,
      action.payload.vizdiv,
      {
        w: viz_width,
        h: height,
        navbar_height: 20,
        aggregator_function: 'AVG',
        stroke_on: true,
        tree_structure: ['generation', 'type1'],
        filter_selections: new Map([
          ['type', new Map([['all', true]])],
        ]),
        render_depth: 1,
        fill_color: function(x) {
          if (x.entity) {
            return x.entity.colors || 'white';
          } else {
            return 'white';
          }
        }
      }
    )
    return Object.assign({}, state, {
      viz_width: viz_width,
      opts_width: window.innerWidth ? window.innerWidth * OPTS_RATIO : 0,
      height: height,
    });
  },
  UPDATE_STRUCTURE: (state, action) => {
    return Object.assign({}, state, {
      color: ['limegreen', 'burlywood'][Math.floor(Math.random() * 2)],
    });
  }
};

export default (state, action) => {
  if (typeof state === 'undefined') {
    return newStore.reduxState.store;
  }

  return action.type in reducers
    ? reducers[action.type](state, action)
    : state;
};
