import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import logo from './logo.svg';
import './App.css';

const marks = {
	180: '3:00',
	240: '4:00',
	300: '5:00',
	360: '6:00',
	420: '7:00',
	480: '8:00',
	540: '9:00',
	600: '10:00',
	900: '15:00',
}

class PaceUnitSelector extends Component {
	onUnitChange(e) {
		if (typeof this.props.onUnitChange === 'function') {
			const newUnit = e.target.value;
			this.props.onUnitChange(newUnit);
		}
	}
	render() {
		return (
			<div>
				<label className="radio-inline">
					<input type="radio" value="km" name="unit" onClick={e => this.onUnitChange(e)} defaultChecked={true} /> KM
				</label>
				<label className="radio-inline">
					<input type="radio" value="m" name="unit" onClick={e => this.onUnitChange(e)} /> M
				</label>
			</div>
		);
	}
}

class PaceControls extends Component {
	render() {
		return (
			<div>
		    <Slider min={0} defaultValue={300} max={900} onChange={this.props.onPaceChange} marks={marks}/>
				<br/>
				<PaceUnitSelector onUnitChange={this.props.onUnitChange}/>
			</div>
		);
	}	
}

class PaceChart extends Component {
	render() {
		return (
			<PaceControls onUnitChange={e => console.log(e)} onPaceChange={e => console.log(e)}/>
		);
	}
}

class App extends Component {
  render() {
    return (
      <div className="App">
				<h1>Pace Chart</h1>
				<PaceChart />
      </div>
    );
  }
}

export default App;
