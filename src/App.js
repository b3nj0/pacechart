import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import './App.css';
import 'rc-slider/assets/index.css';
import * as moment from 'moment';
import Slider from 'rc-slider';
import logo from './logo.svg';
import {IntlProvider, FormattedTime} from 'react-intl';

// important times for the slider control

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

// functions for converting times to distances

function km_to_mi(km) {
    return 0.621371192 * km;
}
function mi_to_km(mi) {
    return 1.60934 * mi;
}
function duration(distance, distance_unit, pace, pace_unit) {
    let d_in_km = distance_unit.to_km(distance)
    let p_in_km = pace / pace_unit.to_km(1)
    let duration_in_km = d_in_km * p_in_km
    return Math.round(duration_in_km)
}

const UNITS = {
    km: { name: 'km', suffix: d => d+'K', range: 42, to_km : d => d, to_mi : d => km_to_mi(d), from_km: d => d },
    mi:  { name: 'mi', suffix: d => d+'M', range: 26, to_km : d => mi_to_km(d), to_mi : d => d, from_km: d => km_to_mi(d) }
}
const km = UNITS.km
const mi = UNITS.mi

const DISTANCES = [
    {d: [1, km],   label:'1K', class:'race'},
    {d: [1, mi],    label:'1M', class:'race'},
    {d: [5, km],   label:'5K', class:'race'},
    {d: [5, mi],    label:'5M', class:'race'},
    {d: [10, km],  label:'10K', class:'race'},
    {d: [15, km],  label:'15K', class:'milestone km'},
    {d: [10, mi],   label:'10M', class:'race'},
    {d: [20, km],  label:'20K', class:'milestone km'},
    {d: [13.1, mi] ,label:'1/2Mar', class:'race'},
    {d: [15, mi],   label:'15M', class:'milestone mi'},
    {d: [25, km],  label:'25K', class:'milestone km'},
    {d: [30, km],  label:'30K', class:'milestone km'},
    {d: [20, mi],   label:'20M', class:'race'},
    {d: [35, km],  label:'35K', class:'milestone km'},
    {d: [40, km],  label:'40K', class:'milestone km'},
    {d: [26.2, mi], label:'Mar', class:'race'},
    {d: [50, km],  label:'50K', class:'race'},
    {d: [50, mi],   label:'50M', class:'race'},
    {d: [100, km], label:'100K', class:'race'},
    {d: [100, mi],  label:'100M', class:'race'},
]

function distances(distance_unit = km) {
    // retain race distances and milestones for given unit
    var ds = DISTANCES.filter( d => !d.class.includes( 'milestone' ) || ( d.class.includes( 'milestone' ) && d.class.includes( distance_unit.name ) ) );
    // fill in kms or ms 
    var ds_i = 0;
    for (var i = 1; i <= distance_unit.range; ) {
        var i_km = distance_unit.to_km(i);
        while (ds_i < ds.length) {
            let [ds_d, ds_u] = ds[ds_i].d;
            let ds_km = ds_u.to_km(ds_d);
            if (ds_km > i_km) {
                ds.splice(ds_i, 0, { d: [i, distance_unit], label: distance_unit.suffix(i), class: ''});
                i++;
                break;
            } else if (ds_km === i_km) {
                i++; 
                break;
            } else {
                ds_i++;
            }
        }
    }
    return ds;
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
					<input type="radio" value="mi" name="unit" onClick={e => this.onUnitChange(e)} /> M
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

class PaceTable extends Component {
  constructor(props) {
    super(props);
    this.state = { distances: distances(props.unit) };
  }
  render() {
    const rows = this.state.distances.map((distance) => {
      let label = distance.label
      let distance_in_mi = distance.d[1].to_mi(distance.d[0])
      let distance_in_km = distance.d[1].to_km(distance.d[0])
			let offset = 5;
      let duration_in_secs_sub_offset = duration(distance.d[0], distance.d[1], this.props.pace - offset, this.props.unit)
      let duration_in_secs = duration(distance.d[0], distance.d[1], this.props.pace, this.props.unit)
      let duration_in_secs_add_offset = duration(distance.d[0], distance.d[1], this.props.pace + offset, this.props.unit)
      let dur = moment.duration(duration_in_secs, 'seconds')
      return (<tr key={distance.label}>
                      <td>{label}</td>
                      <td>{distance_in_mi}</td>
                      <td>{distance_in_km}</td>
                      <td>{duration_in_secs}</td>
                      <td>{dur.toISOString()}</td>
                      <td><FormattedTime value={new Date()} format="hhmm" /></td>
                      </tr>)
    });
    return (
      <IntlProvider locale="en">
				<div>
				<div>Pace Chart</div>
				<table>
					<thead><tr><th>Distance</th><th>Miles</th><th>Kilometres</th></tr></thead>
					<tbody>
						{rows}
					</tbody>
				</table>
				</div>
      </IntlProvider>
   );
  }

}

class PaceChart extends Component {
  constructor(props) {
    super(props);
    this.state = { unit:km, pace:240 };
  }
	render() {
		return (
			<div>
				<PaceControls onUnitChange={e => this.setState({unit: UNITS[e]})} onPaceChange={e => this.setState({pace: e})}/>
				<PaceTable unit={this.state.unit} pace={this.state.pace}/>
			</div>
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
