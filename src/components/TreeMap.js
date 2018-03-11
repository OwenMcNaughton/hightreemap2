import d3 from 'd3v3';

class TreeMap {
  constructor(item_list, div, options) {
    this.opts = options;
    this.div = div;
    this.item_list = item_list;
    this.tree_root = this.build_tree_from_flat_list();
    this.focus_node = this.tree_root;
    this.initialize_d3_visualization(this.tree_root);
    this.accumulate(this.tree_root);
    this.calculate_layout(this.tree_root);
    this.initialize_display(this.tree_root);
  }

  static filter_entities(entities, filters) {
    let filtered_entities = entities;
    for (let [attribute_name, selections] of filters) {
      if (selections.is_num) {
        filtered_entities = TreeMap.filter_by_num(
          filtered_entities,
          attribute_name,
          selections.slider_min,
          selections.slider_max,
        );
      } else {
        filtered_entities = TreeMap.filter_by_normal(
          filtered_entities,
          attribute_name,
          selections.values,
        );
      }
    }
    return filtered_entities;
  }

  static filter_by_normal(entities, attribute, filter) {
    if (filter.get('all')) {
      return entities;
    }
    return entities.filter(s => !s[attribute] || filter.get(s[attribute]));
  }

  static filter_by_num(entities, attribute, min, max) {
    return entities.filter(s => {
      return s[attribute] === undefined ||
        (s[attribute] >= min && s[attribute] <= max);
    });
  }

  build_tree_from_flat_list() {
    const tree_root = this.build_node(
      this.opts.tree_structure[0],
      'root',
      null,
    );
    this.recursively_build_tree(
      tree_root,
      this.opts.tree_structure,
      this.item_list,
    );
    return tree_root;
  }

  recursively_build_tree(node, tree_structure, potential_entities){
    if (tree_structure.length > 0) {
      const groups = this.split_entities_into_groups(
        potential_entities,
        tree_structure[0],
      );
      for (let [group_name, entities] of groups.entries()) {
        const child = this.build_node(
          tree_structure[0],
          String(group_name),
          null,
          groups.size === 1,
        );
        node.children.push(child);
        this.recursively_build_tree(child, tree_structure.slice(1), entities);
      }
    } else {
      this.append_entity_children(node, potential_entities);
    }
  }

  append_entity_children(node, entities) {
    const item_children = [];
    for (let entity of entities) {
      item_children.push(
        this.build_node('leaf', entity.name, entity, entities.length === 1));
    }
    node.children = item_children;
  }

  split_entities_into_groups(entities, split_on) {
    const groups = new Map();
    for (let entity of entities) {
      if (groups.has(entity[split_on])) {
        groups.get(entity[split_on]).push(entity);
      } else {
        groups.set(entity[split_on], [entity]);
      }
    }
    return groups;
  }

  build_node(type, name, entity, only_child = false) {
    let node = {
      node_type: type,
      name: name,
      entity: entity,
      children: [],
      value: 1,
      x: null,
      y: null,
      dx: null,
      dy: null,
      depth: null,
      _children: null,
      parent: null,
      score: undefined,
      only_child: only_child,
    };
    return node;
  }

  initialize_d3_visualization(tree_root) {
    this.x = d3.scale
      .linear()
      .domain([0, this.opts.w])
      .range([0, this.opts.w]);
    this.y = d3.scale
      .linear()
      .domain([0, this.opts.h])
      .range([0, this.opts.h - this.opts.navbar_height]);
    this.treemap = d3.layout
      .treemap()
      .children(function(node, depth) {
        // Prunes branches and leaf nodes that are more than 1 level deeper
        // than the currently focused node.
        return depth ? null : node._children;
      })
      .sort(function(a, b) {
        return a.value - b.value;
      })
      .mode('squarify')
      .round(false);
    tree_root.x = tree_root.y = 0;
    tree_root.dx = this.opts.w;
    tree_root.dy = this.opts.h;
    tree_root.depth = 0;
  }

  accumulate(node) {
    node._children = node.children;
    if (node.children.length > 0) {
      let total_value = 0;
      for (let child of node.children) {
        total_value += this.accumulate(child);
      }
      node.value = total_value;
    }
    return node.value;
  }

  calculate_layout(node: TreeNode): void {
    const treemap = this;
    if (node._children) {
      this.treemap.nodes({_children: node._children});
      (node._children || []).forEach(function(c) {
        c.x = node.x + (c.x || 0) * (node.dx || 0);
        c.y = node.y + (c.y || 0) * (node.dy || 0);
        c.dx = (c.dx || 0) * (node.dx || 0);
        c.dy = (c.dy || 0) * (node.dy || 0);
        c.parent = node;
        treemap.calculate_layout(c);
      });
    }
  }

  initialize_display(tree_root, immediate_transition_path = []) {
    d3.selectAll('svg').remove();
    this.svg = d3
      .select(this.div)
      .append('svg')
      .attr('width', this.opts.w)
      .attr('height', this.opts.h)
      .append('g')
      .attr('transform', 'translate(0,' + this.opts.navbar_height + ')')
      .style('shape-rendering', 'optimizeSpeed');
    this.navbar = this.svg.append('g');
    this.navbar
      .append('rect')
      .attr('fill', '#bd984d')
      .attr('y', -this.opts.navbar_height)
      .attr('width', this.opts.w)
      .attr('height', this.opts.navbar_height)
      .on('mouseover', function(d) {
        d3.select(this).style('fill', '#dc6e5a');
      })
      .on('mouseout', function(d) {
        d3.select(this).style('fill', '#bd984d');
      });
    this.navbar
      .append('text')
      .attr('fill', 'black')
      .attr('x', 6)
      .attr('y', 4 - this.opts.navbar_height)
      .attr('dy', '.75em');
    if (
      immediate_transition_path.length > 0 &&
      tree_root.name === immediate_transition_path[0].name
    ) {
      immediate_transition_path.shift();
    }
    this.update_display(tree_root, immediate_transition_path);
  }

  find_aggregate_score(node) {
    const candidates = TreeMap.gather_all_descendants(node).filter(c => {
      return c && c[this.opts.color_attr] !== undefined;
    });
    if (candidates.length === 1) {
      return candidates[0][this.opts.color_attr];
    }
    const scores = candidates
      .map(candidate => {
        return parseFloat(candidate[this.opts.color_attr]);
      })
      .sort((candidate_a_score, candidate_b_score) => {
        return (candidate_a_score || 0) - (candidate_b_score || 0);
      });
    let score = undefined;
    switch (this.opts.aggregator_function) {
      case 'AVG':
        score = scores.length
          ? scores.reduce(function(sum, value) {
              return sum + value;
            }, 0) / scores.length
          : undefined;
        return score;
      case 'MIN':
        score = scores.shift();
        return score;
      case 'MAX':
        score = scores.pop();
        return score;
      default:
        return undefined;
    }
  }

  static gather_all_descendants(node) {
    function gather_all_descendants_intl(node, candidates) {
      if (node.entity) {
        candidates.push(node.entity);
      } else {
        for (let child of node._children || []) {
          gather_all_descendants_intl(child, candidates);
        }
      }
    }
    let candidates = [];
    gather_all_descendants_intl(node, candidates);
    if (candidates.length === 0 && node.entity) {
      return [node.entity];
    }
    return candidates;
  }

  initialize_tooltip(node) {
    let a = this.opts.color_attr;
    let text = this.navbar_name(node);
    node[a] = this.find_aggregate_score(node);
    text += node[a] !== undefined ? '<br>' + a + ': ' + (node[a] || '') : '';
    text += node._children
      ? '<br>Has ' + TreeMap.gather_all_descendants(node).length + ' entities'
      : '';
    this.tooltip = d3
      .select('body')
      .append('g')
      .html(text)
      .attr('id', 'tooltip')
      .style('z-index', '1000')
      .style('position', 'absolute')
      .style('text-align', 'center')
      .style('padding', '4px')
      .style('font', '12px sans-serif')
      .style('background', '#ddd')
      .style('stroke', 'steelblue')
      .style('border-radius', '8px')
      .style('pointer-events', 'None');
  }

  update_display(node, immediate_transition_path = []) {
    const treemap = this;
    const viz_g = this.svg.append('g').datum(node);
    this.navbar
      .datum(node.parent || this.tree_root)
      .on('click', clicked =>
        treemap.transition(
          [clicked],
          viz_g,
          node.only_child || (d3.event && d3.event.altKey) ? 0 : 1000,
        ),
      )
      .select('text')
      .text(this.navbar_name(node));
    // 'Root' svg group.
    // svg group for the portion of the viz that is currently visible.
    this.focus_g = viz_g
      .selectAll('g')
      .data(node._children)
      .enter()
      .append('g');
    // Click results in transition to parent object.
    this.focus_g
      .filter(function(node) {
        return node._children;
      })
      .on('click', clicked => {
        treemap.transition(
          [clicked],
          viz_g,
          clicked.only_child || (d3.event && d3.event.altKey) ? 0 : 1000,
        );
      });
    this.display_boxes();
    if (immediate_transition_path.length > 0) {
      this.transition(
        immediate_transition_path,
        viz_g,
        immediate_transition_path[0].only_child || (d3.event && d3.event.altKey)
          ? 0
          : 1000,
      );
    }
  }

  fetch_descendants(node, descendants, depth) {
    if (depth <= 0) {
      if (node._children && node._children.length > 0) {
        descendants.push.apply(descendants, node._children || []);
      } else {
        descendants.push(node);
      }
    } else {
      if (node._children && node._children.length > 0) {
        for (let child of node._children) {
          this.fetch_descendants(child, descendants, depth - 1);
        }
      } else {
        descendants.push(node);
      }
    }
  }

  has_focused_parent(node, treemap) {
    if (!treemap.focus_node) {
      return true;
    }
    if (!node.parent) {
      return false;
    }
    if (node.parent === treemap.focus_node) {
      return true;
    }
    return treemap.has_focused_parent(node.parent, treemap);
  }

  display_boxes(force_score_recalculation = false) {
    const treemap = this;
    // Append all the child rectangles.
    if (this.opts.render_depth != 0) {
      this.focus_g
        .selectAll('.child')
        .data(function(node) {
          const descendants = [];
          if (treemap.has_focused_parent(node, treemap)) {
            treemap.fetch_descendants(
              node,
              descendants,
              treemap.opts.render_depth - 1,
            );
          }
          return descendants;
        })
        .enter()
        .append('rect')
        .attr('fill', function(node) {
          node.color = treemap.opts.fill_color(node, treemap.opts.color_attr);
          return node.color;
        })
        .attr('fill-opacity', '1.0')
        .attr('stroke', this.opts.stroke_on ? '#999' : 'none')
        .on('mouseover', function(d) {
          d3.select(this).style('fill-opacity', '0.5');
          d3.select('#tooltip').remove();
          treemap.initialize_tooltip(d);
        })
        .on('mouseout', function(d) {
          d3.select(this).style('fill-opacity', '1.0');
          d3.select('#tooltip').remove();
        })
        .on('mousemove', function(d) {
          const right = d3.event.pageX > (treemap.opts.w - 100);
          const bottom = d3.event.pageY > (treemap.opts.h - 100);
          const w = treemap.tooltip[0][0].getBoundingClientRect().width;
          const h = treemap.tooltip[0][0].getBoundingClientRect().height;
          treemap.tooltip
            .style('left', d3.event.pageX + (right ? -(10 + w) : 10) + 'px')
            .style('top', d3.event.pageY - (bottom ? (h) : 10) + 'px');
        })
        .on('click', node => {
          if (node.entity) {
            treemap.goto_divedash(node.entity);
          }
        })
        .call(this.render_rect);
    }
    // Append the parent rectangles.
    this.focus_g
      .append('rect')
      .attr('fill', function(node) {
        node[treemap.opts.color_attr] = treemap.find_aggregate_score(node);
        if (node.node_type === 'leaf' || treemap.opts.render_depth == 0) {
          return treemap.opts.fill_color(node, treemap.opts.color_attr);
        } else {
          return 'none';
        }
      })
      .attr('stroke', '#333')
      .attr('stroke-width', '3')
      .on('mouseover', function(d) {
        if (d.entity) {
          d3.select(this).attr('stroke-width', '10');
          d3.select(d.label).style('visibility', 'visible');
        }
      })
      .on('mouseout', function(d) {
        if (d.entity) {
          d3.select(this).attr('stroke-width', '3');
          d3.select(d.label).style('visibility', 'hidden');
        }
      })
      .call(this.render_rect);
    // Append labels.
    this.focus_g
      .append('text')
      .attr('dy', '.75em')
      .attr('font-size', '100%')
      .style('stroke', 'black')
      .style('stroke-width', '4px')
      .style('opacity', '0.8')
      .call(this.render_label)
      .text(function(node) {
        node.label = this;
        return (
          node.name +
          (node[treemap.opts.color_attr] !== undefined
            ? ': ' + TreeMap.short_number(node[treemap.opts.color_attr], 2)
            : '')
        );
      });
    this.focus_g
      .append('text')
      .attr('dy', '.75em')
      .attr('font-size', '100%')
      .style('fill', 'white')
      .call(this.render_label)
      .text(function(node) {
        node.label = this;
        return (
          node.name +
          (node[treemap.opts.color_attr] !== undefined
            ? ': ' + TreeMap.short_number(node[treemap.opts.color_attr], 2)
            : '')
        );
      });
  }

  transition(path, viz_g, duration) {
    d3.select('#tooltip').remove();
    const selected = path[0];
    this.focus_node = selected;
    if (selected.entity) {
      this.goto_divedash(selected.entity);
      return;
    }
    if (this.transitioning || !selected) return;
    this.transitioning = true;
    this.update_display(selected);
    const viz_trans = viz_g
      .transition()
      .duration(duration)
      .ease('quad-in');
    const trans_g_trans = this.focus_g
      .transition()
      .duration(duration)
      .ease('quad-in');
    this.x.domain([selected.x, selected.x + selected.dx]);
    this.y.domain([selected.y, selected.y + selected.dy]);
    this.svg.selectAll('.depth').sort(function(a, b) {
      return a.depth - b.depth - 1;
    });
    this.focus_g.selectAll('text').style('fill-opacity', 0);
    viz_trans
      .selectAll('text')
      .call(this.render_label)
      .style('fill-opacity', 0);
    trans_g_trans
      .selectAll('text')
      .call(this.render_label)
      .style('fill-opacity', 1);
    viz_trans.selectAll('rect').call(this.render_rect);
    trans_g_trans.selectAll('rect').call(this.render_rect);
    const treemap = this;
    viz_trans.remove().each('end', function() {
      treemap.transitioning = false;
      const last = path.shift();
      treemap.initialize_display(last, path);
    });
  }

  render_label = (text) => {
    const treemap = this;
    text
      .attr('x', function(node) {
        return treemap.x(node.x) + 6;
      })
      .attr('y', function(node) {
        return treemap.y(node.y) + 6;
      })
      .attr('pointer-events', 'none')
      .style('visibility', function(node) {
        return node.entity ? 'hidden' : 'visible';
      });
  };

  render_rect = (rect) => {
    const treemap = this;
    rect
      .attr('x', function(node) {
        return treemap.x(node.x);
      })
      .attr('y', function(node) {
        return treemap.y(node.y);
      })
      .attr('width', function(node) {
        return treemap.x(node.x + node.dx) - treemap.x(node.x);
      })
      .attr('height', function(node) {
        return treemap.y(node.y + node.dy) - treemap.y(node.y);
      });
  };

  zoom_to(entity) {
    const zoom_path = [];
    this.recursively_locate_entity(this.tree_root, entity, zoom_path);
    // So that the transitions are in the right order.
    zoom_path.reverse();
    // So that we go back to the root before homing in on the selection.
    zoom_path.unshift(this.tree_root);
    this.initialize_display(this.tree_root, zoom_path);
  }

  recursively_locate_entity(node, entity, zoom_path) {
    if (node.entity) {
      return node.entity.name === entity.name;
    } else {
      const found = (node._children || []).find(node =>
        this.recursively_locate_entity(node, entity, zoom_path),
      );
      if (found !== undefined) {
        zoom_path.push(found);
      }
      return found !== undefined;
    }
  }

  navbar_name(node) {
    return node.parent
      ? this.navbar_name(node.parent) + ' ==> ' + node.name
      : '';
  }

  update_colors(new_fill_color, color_attr) {
    this.opts.fill_color = new_fill_color;
    this.opts.color_attr = color_attr;
    this.focus_g.selectAll('rect').remove();
    this.focus_g.selectAll('text').remove();
    this.display_boxes();
  }

  update_color_by_timestamp(new_timestamp) {
    this.focus_g.selectAll('rect').remove();
    this.focus_g.selectAll('text').remove();
    this.opts.selected_timestamp = new_timestamp;
    this.display_boxes(true);
  }

  stroke_toggle() {
    this.opts.stroke_on = !this.opts.stroke_on;
    this.focus_g.selectAll('rect').attr(
      'stroke',
      function(node) {
        if (this.opts.stroke_on) {
          return node.node_type === 'leaf' ? '#999' : '#333';
        }
        return 'none';
      }.bind(this),
    );
  }

  goto_divedash(entity) {
    window.open(entity.uri);
  }

  static short_number(num, decimals) {
    if (num === null) {
      return '';
    }
    num = parseFloat(num);
    const trillion_ceiling = 14;
    decimals = !decimals || decimals < 0 ? 0 : decimals;
    const power_parts = num.toPrecision(2).split('e');
    const floored =
      power_parts.length === 1
        ? 0
        : Math.floor(
            Math.min(Number(power_parts[1].slice(1)), trillion_ceiling) / 3,
          );
    const div_by_power = Number(
      floored < 1
        ? num.toFixed(0 + decimals)
        : (num / Math.pow(10, floored * 3)).toFixed(1 + decimals),
    );
    const neg_check = div_by_power < 0 ? div_by_power : Math.abs(div_by_power);
    return neg_check + ['', 'k', 'm', 'b', 't'][floored];
  }
}

export default TreeMap;
