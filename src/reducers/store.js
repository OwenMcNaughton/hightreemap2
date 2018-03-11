import d3 from 'd3v3';
import newStore from './newStore';
import { OPTS_RATIO } from '../constants';
import { data, colorer, selected_tree } from '../pokemon';
import TreeMap from '../components/TreeMap'

const color_regex = /^#[0-9A-Fa-f]{6}|[0-9A-Fa-f]{3}$/i;

function get_initial_tree_structure(data) {
  const node_names = new Set();
  for (let entity of data) {
    for (let node in entity) {
      if (entity.hasOwnProperty(node) && node !== 'name' && node !== 'uri') {
        node_names.add(node);
      }
    }
  }
  return {
    selected: selected_tree,
    available: Array.from(new Set([...(new Set(node_names))]
      .filter(x => !(new Set(selected_tree)).has(x)))),
  };
}

function get_initial_filters(data) {
  const filters = new Map();
  for (let entity of data) {
    for (let node in entity) {
      if (entity.hasOwnProperty(node) && node !== 'name' && node !== 'uri') {
        let is_num = !isNaN(parseFloat(entity[node]));
        if (filters.has(node)) {
          const filter = filters.get(node);
          if (is_num) {
            filter.max = Math.max(filter.max, entity[node]);
            filter.min = Math.min(filter.min, entity[node]);
            filter.slider_max = Math.max(filter.max, entity[node]);
            filter.slider_min = Math.min(filter.min, entity[node]);
          } else {
            filter.values.set(entity[node], true);
          }
        } else {
          if (is_num) {
            filters.set(
              node, {
                name: node,
                min: entity[node],
                max: entity[node],
                slider_min: entity[node],
                slider_max: entity[node],
                is_num: true,
              })
          } else {
            filters.set(
              node, {
                name: node,
                values: new Map([[entity[node], true]]),
                is_num: is_num,
              },
            );
          }
        }
      }
    }
  }
  return filters;
}

function initViz(ctx) {
  ctx.filtered_entities = TreeMap.filter_entities(data, ctx.filters);
  ctx.treemap = new TreeMap(
    ctx.filtered_entities,
    ctx.vizdiv,
    {
      w: ctx.viz_width - 3,
      h: ctx.height - 3,
      navbar_height: 20,
      aggregator_function: 'AVG',
      stroke_on: true,
      tree_structure: ctx.tree_structure.selected,
      render_depth: ctx.render_depth,
      color_attr: ctx.colorer,
      fill_color: ctx.fill_color,
    }
  );
  return ctx;
}

const reducers = {
  WINDOW_UPDATE: (state, action) => {
    if (this.only_once) {
      return;
    }
    this.only_once = true;
    this.viz_width = window.innerWidth
      ? window.innerWidth * (1 - OPTS_RATIO) : 0;
    this.height = window.innerHeight || 0;
    this.vizdiv = action.payload.vizdiv;
    this.tree_structure = get_initial_tree_structure(data);
    this.filters = get_initial_filters(data);
    this.selected_filter = Array.from(this.filters.keys())[0];
    this.colorer = colorer;
    this.gradients = create_gradients(data, this.colorer);
    this.fill_color = create_fill_color_function(this.gradients);
    this.render_depth = 1;
    this.pct_col_start = 'red';
    this.pct_col_end = 'white';
    initViz(this);
    return Object.assign({}, state, {
      viz_width: this.viz_width,
      opts_width: window.innerWidth ? window.innerWidth * OPTS_RATIO : 0,
      height: this.height,
      tree_structure: this.tree_structure,
      filters: this.filters,
      sig: !state.sig,
      selected_filter: this.selected_filter,
      gradients: this.gradients,
      colorer: this.colorer,
      render_depth: this.render_depth,
      pct_col_start: this.pct_col_start,
      pct_col_end: this.pct_col_end,
    });
  },
  UPDATE_STRUCTURE: (state, action) => {
    this.tree_structure = action.payload;
    initViz(this);
    return Object.assign({}, state, {
      tree_structure: this.tree_structure,
      sig: !state.sig,
    });
  },
  UPDATE_DEPTH: (state, action) => {
    this.render_depth = action.payload;
    initViz(this);
    return Object.assign({}, state, {
      render_depth: this.render_depth,
    });
  },
  PANE_SELECT: (state, action) => {
    this.selected_pane = action.payload;
    return Object.assign({}, state, {selected_pane: action.payload});
  },
  FILTER_SELECT: (state, action) => {
    this.selected_fitler = action.payload;
    return Object.assign({}, state, {selected_filter: action.payload});
  },
  FILTER_CHANGE: (state, action) => {
    this.filters = action.payload;
    initViz(this);
    return Object.assign({}, state,
                         {sig: !state.sig, filters: this.filters});
  },
  GRADIENTS_CHANGE: (state, action) => {
    this.gradients = action.payload;
    if (validate_gradients(this.gradients)) {
      this.fill_color = create_fill_color_function(this.gradients);
      this.treemap.update_colors(this.fill_color, this.colorer);
    }
    return Object.assign({}, state,
      {sig: !state.sig, gradients: this.gradients});
  },
  COLORER_CHANGE: (state, action) => {
    this.colorer = action.payload;
    this.gradients = create_gradients(data, this.colorer);
    if (validate_gradients(this.gradients)) {
      this.fill_color = create_fill_color_function(this.gradients);
      this.treemap.update_colors(this.fill_color, this.colorer);
    }
    return Object.assign({}, state,
      {sig: !state.sig, colorer: this.colorer, gradients: this.gradients});
  },
  PCT_CHANGE: (state, action) => {
    this.pct_col_start = action.payload.start;
    this.pct_col_end = action.payload.end;
    this.pct_str = action.payload.str;
    if (val_color(this.pct_col_start) && val_color(this.pct_col_end)) {
      if (this.pct_str && val_pct_str(this.pct_str)) {
        this.gradients = generate_pct_gradients(this);
        this.fill_color = create_fill_color_function(this.gradients);
        this.treemap.update_colors(this.fill_color, this.colorer);
        state = Object.assign({}, state,
          {sig: !state.sig, gradients: this.gradients});
      }
    }
    return Object.assign({}, state, {
      pct_str: this.pct_str,
      pct_col_start: this.pct_col_start,
      pct_col_end: this.pct_col_end,
    });
  },
  RESET_FILTER: (state, action) => {
    this.filters = get_initial_filters(data);
    initViz(this);
    return Object.assign({}, state, { filters: this.filters });
  }
};

function generate_pct_gradients(ctx) {
  const sorted_data = get_all_filtered_data(ctx.colorer).sort((a, b) => a - b);
  let pcts = ctx.pct_str.split(',').map(x => parseFloat(x));
  pcts.push(0);
  pcts.push(100);
  pcts = pcts.sort((a, b) => a - b);
  const colors = d3.scale
    .linear()
    .domain([0, pcts.length - 2])
    .interpolate(d3.interpolateLab)
    .range([ctx.pct_col_start, ctx.pct_col_end]);
  let color_gradients = [];
  for (let i = 0; i != pcts.length - 1; i++) {
    const start_perc = data.length * (pcts[i] / 100) - 1;
    const end_perc = data.length * (pcts[i + 1] / 100) - 1;
    color_gradients.push({
      'domain_start': sorted_data[Math.floor(start_perc >= 0 ? start_perc : 0)],
      'domain_end': sorted_data[Math.floor(end_perc >= 0 ? end_perc : 0)],
      'color_start': colors(i),
      'color_end': colors(i),
    });
  }
  return color_gradients;
}

function val_pct_str(pct_str) {
  return pct_str.split(',').every(x => !isNaN(parseFloat(x)));
}

function get_all_filtered_data(colorer) {
  return data.map(x => parseFloat(x[colorer]));
}

function validate_gradients(gradients) {
  for (let g of gradients) {
    if (isNaN(parseFloat(g.domain_start)) ||
        isNaN(parseFloat(g.domain_end))) {
      return false;
    }
    if (!val_color(g.color_start) || !val_color(g.color_end)) {
      return false;
    }
  }
  return true;
}

function val_color(c) {
  let a = color_regex.test(colourNameToHex(c));
  let b = color_regex.test(c);
  return color_regex.test(c) || color_regex.test(colourNameToHex(c));
}

function create_gradients(data, attr) {
  const max = data.map(a => a[attr]).reduce((a, b) => Math.max(a, b), 0);
  const min = data.map(a => a[attr]).reduce((a, b) => Math.min(a, b), 0);
  return [{
    'domain_start': min,
    'domain_end': max,
    'color_start': 'red',
    'color_end': 'white',
  }];
}

function create_fill_color_function(color_gradients) {
  const color_scales = color_gradients.map(cg => {
    return d3.scale
      .linear()
      .domain([cg.domain_start, cg.domain_end])
      .range([cg.color_start, cg.color_end])
      .interpolate(d3.interpolateLab);
  });
  return function(x, attribute) {
    function fc(val) {
      if (val === undefined) {
        return '#bbb';
      }
      for (let i = 0; i !== color_gradients.length; i++) {
        if (
          val >= color_gradients[i].domain_start &&
          val <= color_gradients[i].domain_end
        ) {
          return color_scales[i](val);
        }
      }
      return '#bbb';
    }

    if (x.type === 'leaf') {
      if (x.entity[attribute]) {
        return fc(x.entity[attribute]);
      } else {
        return '#bbb';
      }
    } else {
      const descendants = TreeMap.gather_all_descendants(x);
      let vals = descendants
        .filter(x => x[attribute])
        .map(x => x[attribute]);
      let avg = vals.reduce((a, b) => a + parseInt(b, 10), 0) / vals.length;
      return fc(avg);
      return avgColor(
        descendants
          .filter(x => x[attribute])
          .map(x => this(x, attribute)));
    }
  };
}

function colourNameToHex(colour) {
  var colours = {
    "aliceblue": "#f0f8ff",
    "antiquewhite": "#faebd7",
    "aqua": "#00ffff",
    "aquamarine": "#7fffd4",
    "azure": "#f0ffff",
    "beige": "#f5f5dc",
    "bisque": "#ffe4c4",
    "black": "#000000",
    "blanchedalmond": "#ffebcd",
    "blue": "#0000ff",
    "blueviolet": "#8a2be2",
    "brown": "#a52a2a",
    "burlywood": "#deb887",
    "cadetblue": "#5f9ea0",
    "chartreuse": "#7fff00",
    "chocolate": "#d2691e",
    "coral": "#ff7f50",
    "cornflowerblue": "#6495ed",
    "cornsilk": "#fff8dc",
    "crimson": "#dc143c",
    "cyan": "#00ffff",
    "darkblue": "#00008b",
    "darkcyan": "#008b8b",
    "darkgoldenrod": "#b8860b",
    "darkgray": "#a9a9a9",
    "darkgreen": "#006400",
    "darkkhaki": "#bdb76b",
    "darkmagenta": "#8b008b",
    "darkolivegreen": "#556b2f",
    "darkorange": "#ff8c00",
    "darkorchid": "#9932cc",
    "darkred": "#8b0000",
    "darksalmon": "#e9967a",
    "darkseagreen": "#8fbc8f",
    "darkslateblue": "#483d8b",
    "darkslategray": "#2f4f4f",
    "darkturquoise": "#00ced1",
    "darkviolet": "#9400d3",
    "deeppink": "#ff1493",
    "deepskyblue": "#00bfff",
    "dimgray": "#696969",
    "dodgerblue": "#1e90ff",
    "firebrick": "#b22222",
    "floralwhite": "#fffaf0",
    "forestgreen": "#228b22",
    "fuchsia": "#ff00ff",
    "gainsboro": "#dcdcdc",
    "ghostwhite": "#f8f8ff",
    "gold": "#ffd700",
    "goldenrod": "#daa520",
    "gray": "#808080",
    "green": "#008000",
    "greenyellow": "#adff2f",
    "honeydew": "#f0fff0",
    "hotpink": "#ff69b4",
    "indianred ": "#cd5c5c",
    "indigo": "#4b0082",
    "ivory": "#fffff0",
    "khaki": "#f0e68c",
    "lavender": "#e6e6fa",
    "lavenderblush": "#fff0f5",
    "lawngreen": "#7cfc00",
    "lemonchiffon": "#fffacd",
    "lightblue": "#add8e6",
    "lightcoral": "#f08080",
    "lightcyan": "#e0ffff",
    "lightgoldenrodyellow": "#fafad2",
    "lightgrey": "#d3d3d3",
    "lightgreen": "#90ee90",
    "lightpink": "#ffb6c1",
    "lightsalmon": "#ffa07a",
    "lightseagreen": "#20b2aa",
    "lightskyblue": "#87cefa",
    "lightslategray": "#778899",
    "lightsteelblue": "#b0c4de",
    "lightyellow": "#ffffe0",
    "lime": "#00ff00",
    "limegreen": "#32cd32",
    "linen": "#faf0e6",
    "magenta": "#ff00ff",
    "maroon": "#800000",
    "mediumaquamarine": "#66cdaa",
    "mediumblue": "#0000cd",
    "mediumorchid": "#ba55d3",
    "mediumpurple": "#9370d8",
    "mediumseagreen": "#3cb371",
    "mediumslateblue": "#7b68ee",
    "mediumspringgreen": "#00fa9a",
    "mediumturquoise": "#48d1cc",
    "mediumvioletred": "#c71585",
    "midnightblue": "#191970",
    "mintcream": "#f5fffa",
    "mistyrose": "#ffe4e1",
    "moccasin": "#ffe4b5",
    "navajowhite": "#ffdead",
    "navy": "#000080",
    "oldlace": "#fdf5e6",
    "olive": "#808000",
    "olivedrab": "#6b8e23",
    "orange": "#ffa500",
    "orangered": "#ff4500",
    "orchid": "#da70d6",
    "palegoldenrod": "#eee8aa",
    "palegreen": "#98fb98",
    "paleturquoise": "#afeeee",
    "palevioletred": "#d87093",
    "papayawhip": "#ffefd5",
    "peachpuff": "#ffdab9",
    "peru": "#cd853f",
    "pink": "#ffc0cb",
    "plum": "#dda0dd",
    "powderblue": "#b0e0e6",
    "purple": "#800080",
    "rebeccapurple": "#663399",
    "red": "#ff0000",
    "rosybrown": "#bc8f8f",
    "royalblue": "#4169e1",
    "saddlebrown": "#8b4513",
    "salmon": "#fa8072",
    "sandybrown": "#f4a460",
    "seagreen": "#2e8b57",
    "seashell": "#fff5ee",
    "sienna": "#a0522d",
    "silver": "#c0c0c0",
    "skyblue": "#87ceeb",
    "slateblue": "#6a5acd",
    "slategray": "#708090",
    "snow": "#fffafa",
    "springgreen": "#00ff7f",
    "steelblue": "#4682b4",
    "tan": "#d2b48c",
    "teal": "#008080",
    "thistle": "#d8bfd8",
    "tomato": "#ff6347",
    "turquoise": "#40e0d0",
    "violet": "#ee82ee",
    "wheat": "#f5deb3",
    "white": "#ffffff",
    "whitesmoke": "#f5f5f5",
    "yellow": "#ffff00",
    "yellowgreen": "#9acd32"
  };

  if (typeof colours[colour.toLowerCase()] !== 'undefined') {
    return colours[colour.toLowerCase()];
  }

  return false;
}

function avgColor(colors) {
  const splitses = [];
  for (let c of colors) {
    const split = splitRGB(c);
    if (split) {
      splitses.push(split);
    }
  }
  const r = splitses.reduce((acc, cur) => acc + cur[0], 0) / splitses.length;
  const g = splitses.reduce((acc, cur) => acc + cur[1], 0) / splitses.length;
  const b = splitses.reduce((acc, cur) => acc + cur[2], 0) / splitses.length;
  return '#' + (Math.round(r) < 16 ? '0' : '') + Math.round(r).toString(16) +
               (Math.round(g) < 16 ? '0' : '') + Math.round(g).toString(16) +
               (Math.round(b) < 16 ? '0' : '') + Math.round(b).toString(16);
}

function splitRGB(color) {
  function _split(c) {
    return [parseInt(c.slice(1, 3), 16),
            parseInt(c.slice(3, 5), 16),
            parseInt(c.slice(5, 7), 16)];
  }
  if (color.length > 0 && color[0] === '#') {
    return _split(color);
  } else {
    const rgb = colourNameToHex(color);
    if (rgb) {
      return _split(rgb);
    }
  }
}

export default (state, action) => {
  if (typeof state === 'undefined') {
    return newStore.reduxState.store;
  }
  return action.type in reducers
    ? reducers[action.type](state, action)
    : state;
};
