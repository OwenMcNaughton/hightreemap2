import { connect } from 'react-redux';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import PropTypes from 'prop-types';
import React from 'react';
import ReactTooltip from 'react-tooltip'

const grid = 4;

const getItemStyle = (isDragging, draggableStyle) => ({
  // some basic styles to make the items look a bit nicer
  userSelect: 'none',
  padding: grid * 1,
  margin: `0 0 ${grid}px 0`,
  color: '#555',
  borderRadius: 5,
  textAlign: 'center',

  // change background colour if dragging
  background: isDragging ? 'lightgreen' : 'white',

  // styles we need to apply on draggables
  ...draggableStyle,
});

const getListStyle = (isDraggingOver, props, items) => ({
  background: isDraggingOver ? 'lightblue' : 'lightgrey',
  padding: grid,
  width: props.owidth,
  height: props.height ? Math.min(items.length * 30 - 3, props.height) : 0,
});

let shittyCurrier = {};

class TreeStructure extends React.Component {
  constructor(props) {
    super(props);
    this.onDragEnd = this.onDragEnd.bind(this);
    this.on_depth_change = this.on_depth_change.bind(this);
  }

  onDragEnd(result) {
    // dropped outside the list
    if (!result.destination) {
      return;
    }
    const sid = result.source.droppableId;
    const did = result.destination.droppableId;
    const ts = this.props.tree_structure;
    if (sid === 'selected' && did === 'selected') {
      const [removed] = ts.selected.splice(result.source.index, 1);
      ts.selected.splice(result.destination.index, 0, removed);
    } else if (sid === 'selected' && did === 'available') {
      const [removed] = ts.selected.splice(result.source.index, 1);
      ts.available.splice(result.destination.index, 0, removed);
    } else if (sid === 'available' && did === 'selected') {
      const [removed] = ts.available.splice(result.source.index, 1);
      ts.selected.splice(result.destination.index, 0, removed);
    } else {
      const [removed] = ts.available.splice(result.source.index, 1);
      ts.available.splice(result.destination.index, 0, removed);
    }
    shittyCurrier = ts;
    this.props.onUpdateStructure();
  }

  on_depth_change(event) {
    shittyCurrier = event.target.value;
    this.props.onDepthChange();
  }

  render_list(name, tree_structure) {
    const items = tree_structure[name] || [];
    return (
      <Droppable droppableId={name}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            style={getListStyle(snapshot.isDraggingOver, this.props, items)}
          >
            {items.map((item, index) => (
              <Draggable key={item} draggableId={item} index={index}>
                {(provided, snapshot) => (
                  <div>
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={getItemStyle(
                        snapshot.isDragging,
                        provided.draggableProps.style
                      )}
                    >
                      {item}
                    </div>
                    {provided.placeholder}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    );
  }

  render_depth_slider() {
    return (
      <label>
        {this.props.render_depth}
        <input
          id="render_depth"
          ref="render_depth"
          type="range"
          min={0}
          max={this.props.tree_structure.selected.length}
          value={this.props.render_depth}
          onChange={this.on_depth_change}
        />
      </label>
    );
  }

  render() {
    const tree_structure = this.props.tree_structure || [];
    return (
      <div style={{textAlign: 'center'}}>
        {this.render_depth_slider()}
        <DragDropContext onDragEnd={this.onDragEnd}>
          <a data-tip={"Determines how entities are grouped together. " +
                       "Drag n drop to reorder and change the tree structure."}>
            Current Structure
          </a>
          <ReactTooltip place="top" type="dark" effect="float"/>
          {this.render_list('selected', tree_structure)}
          <br/>
          <a data-tip={"Drag these onto the current structure list."}>
            Available Structure Nodes
          </a>
          <ReactTooltip place="top" type="dark" effect="float"/>
          <br/>
          {this.render_list('available', tree_structure)}
        </DragDropContext>
      </div>
    );
  }
}

TreeStructure.propTypes = {
  onUpdateStructure: PropTypes.func.isRequired,
};

TreeStructure.defaultProps = {
  hello: 'arse',
};

const mapStateToProps = ({ store }) => ({
  ...store,
});

const mapDispatchToProps = dispatch => ({
  onUpdateStructure: () => dispatch({
    type: 'UPDATE_STRUCTURE',
    payload: shittyCurrier,
  }),
  onDepthChange: () => dispatch({
    type: 'UPDATE_DEPTH',
    payload: shittyCurrier,
  })
});

export default connect(mapStateToProps, mapDispatchToProps)(TreeStructure);
