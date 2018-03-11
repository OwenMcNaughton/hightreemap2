import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware, combineReducers } from 'redux';
import thunk from 'redux-thunk';
import storeReducer from './reducers/store';
import './index.css';
import App from './App';

// Unload previous state from local storage if present, otherwise
// a blank Flatris instance will be rendered
// const prevState = localStorage.getItem('highTreemapState');
const prevState = undefined;
const initialState = prevState ? { store: JSON.parse(prevState) } : undefined;

const rootReducer = combineReducers({
  store: storeReducer,
});

const store = createStore(rootReducer, initialState, applyMiddleware(thunk));

store.subscribe(() => {
  localStorage.setItem('highTreemapState', JSON.stringify(store.getState().store));
});

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
);

if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('./service-worker.js');
  });
}
