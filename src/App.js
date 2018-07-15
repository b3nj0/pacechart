import React, { Component } from 'react';
import ReactGA from 'react-ga';
import './App.css';
import 'rc-slider/assets/index.css';
import * as moment from 'moment';
import 'moment-duration-format';
import Cookies from 'universal-cookie';
import Slider from 'rc-slider';
import { Container, Divider, Form, Grid, Radio, Table } from 'semantic-ui-react';
import { RIEInput } from 'riek';

// cookies for storing pace and unit

const cookies = new Cookies();

// initialise google analytics
ReactGA.initialize('UA-106929065-1', {titleCase: false}); 
ReactGA.pageview('/');

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
    {d: [0.4, km],  label:'400m', class:'race'},
    {d: [0.8, km],  label:'800m', class:'race'},
    {d: [1, km],    label:'1K', class:'race'},
    {d: [1.5, km],  label:'1500m', class:'race'},
    {d: [1, mi],    label:'1M', class:'race'},
    {d: [5, km],    label:'5K', class:'race'},
    {d: [5.6, km],  label:'5.6K', class:'race'},
    {d: [5, mi],    label:'5M', class:'race'},
    {d: [10, km],   label:'10K', class:'race'},
    {d: [15, km],   label:'15K', class:'milestone km'},
    {d: [10, mi],   label:'10M', class:'race'},
    {d: [20, km],   label:'20K', class:'milestone km'},
    {d: [13.1, mi], label:'1/2Mar', class:'race'},
    {d: [15, mi],   label:'15M', class:'milestone mi'},
    {d: [25, km],   label:'25K', class:'milestone km'},
    {d: [30, km],   label:'30K', class:'milestone km'},
    {d: [20, mi],   label:'20M', class:'race'},
    {d: [35, km],   label:'35K', class:'milestone km'},
    {d: [40, km],   label:'40K', class:'milestone km'},
    {d: [26.2, mi], label:'Mar', class:'race'},
    {d: [50, km],   label:'50K', class:'race'},
    {d: [50, mi],   label:'50M', class:'race'},
    {d: [100, km],  label:'100K', class:'race'},
    {d: [100, mi],  label:'100M', class:'race'},
    {d: [200, mi],  label:'200M', class:'race'},
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

// parsing code

function parseDuration(durationStr) {
  let tokens = durationStr.split(/:/).map((t) => parseInt(t, 10)).reverse();
  let duration = moment.duration( { seconds: tokens[0], minutes: tokens[1], hours: tokens[2] } )
  if (!duration.isValid() || tokens.length > 3 || duration.asMilliseconds() <= 0) {
    return moment.duration.invalid();
  }
  return duration;
}

class PaceUnitSelector extends Component {
  constructor(props) {
    super(props);
    this.state = {unit: this.props.unit};
  }
  onUnitChange = (e, data) => {
    const newUnit = UNITS[data.value];
    ReactGA.event({category: 'pace_input', action: 'unit_change', value: newUnit === mi ? 1 : 0});
    if (typeof this.props.onUnitChange === 'function') {
      this.setState({unit: newUnit});
      this.props.onUnitChange(newUnit);
    }
  }
  render() {
    return (
      <Form>
        <div className={'inline fields'}>
          <Form.Field className="radio-inline">
            <Radio value="km" name="unit" checked={this.state.unit === km} onClick={this.onUnitChange} label="KM"/>
          </Form.Field>
          <Form.Field className="radio-inline">
            <Radio value="mi" name="unit" checked={this.state.unit === mi} onClick={this.onUnitChange} label="M"/>
          </Form.Field>
        </div>
      </Form>
    );
  }
}

class PaceControls extends Component {
  onPaceChanged = () => {
    ReactGA.event({category: 'pace_input', action: 'pace_change', value: this.props.pace});
  }
  render() {
    return (
      <div>
        <Slider min={0} value={this.props.pace} max={900} onChange={this.props.onPaceChange} onAfterChange={this.onPaceChanged} marks={marks}/>
        <Divider hidden/>
        <Grid>
          <Grid.Row centered>
            <PaceUnitSelector unit={this.props.unit} onUnitChange={this.props.onUnitChange}/>
          </Grid.Row>
        </Grid>
      </div>
    );
  }
}

class PaceTable extends Component {
  validateDuration = (value) => {
    return parseDuration(value).isValid();
  }
  onDurationChange = (distance, duration) =>  {
    let duration_in_secs = duration.asSeconds();
    let distance_in_km = distance.d[1].to_km(distance.d[0])
    let pace_per_km = duration_in_secs / distance_in_km;
    let pace_per_unit = pace_per_km / this.props.unit.from_km(1);
    ReactGA.event({category: 'pace_input', action: 'duration_change', value: distance_in_km});
    return this.props.onPaceChange(pace_per_unit);
  }
  render() {
    const pace = this.props.pace;
    const offset = 5;
    const pace_unit = this.props.unit;
    
    const distances_to_show = distances(this.props.unit)
    
    let duration_offset = (distance, pace, offset) => {
      return duration(distance.d[0], distance.d[1], pace + offset, pace_unit)
    } 
    let formatted_duration = (dur) => {
      return moment.duration(dur, 'seconds').format('h:mm:ss');
    }
    let formatted_speed = (dur) => {
      return formatted_duration(dur) + '/' + pace_unit.name;
    }

    const rows = distances_to_show.map((distance) => {
      let label = distance.label
      return (
          <Table.Row key={label} className={distance.class}>
            <Table.Cell>{label}</Table.Cell>
            <Table.Cell>{formatted_duration(duration_offset(distance, pace, -(2*offset)))}</Table.Cell>
            <Table.Cell>{formatted_duration(duration_offset(distance, pace, -offset))}</Table.Cell>
            <Table.Cell className={distance.class + ' pace-col'}>
              <RIEInput 
                value={formatted_duration(duration_offset(distance, pace, 0))} 
                propName='pace' 
                change={e => this.onDurationChange(distance, parseDuration(e.pace))}
                validate={this.validateDuration}/>
            </Table.Cell>
            <Table.Cell>{formatted_duration(duration_offset(distance, pace, offset))}</Table.Cell>
            <Table.Cell>{formatted_duration(duration_offset(distance, pace, (2*offset)))}</Table.Cell>
          </Table.Row>
      );
    });

    return (
        <Table celled compact='very' definition selectable>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell/>
              <Table.HeaderCell>{formatted_speed(pace-(2*offset))}</Table.HeaderCell>
              <Table.HeaderCell>{formatted_speed(pace-offset)}</Table.HeaderCell>
              <Table.HeaderCell>{formatted_speed(pace)}</Table.HeaderCell>
              <Table.HeaderCell>{formatted_speed(pace+offset)}</Table.HeaderCell>
              <Table.HeaderCell>{formatted_speed(pace+(2*offset))}</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {rows}
          </Table.Body>
        </Table>
   );
  }

}

class PaceChart extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      unit: UNITS[cookies.get('unit') || km.name], 
      pace: parseInt(cookies.get('pace') || '300', 10)
    };
  }
  onUnitChange = (newUnit) => {
    cookies.set('unit', newUnit.name, {path: ''});
    this.setState({unit: newUnit});
  }
  onPaceChange = (newPace) => {
    cookies.set('pace', newPace, {path: ''});
    this.setState({pace: newPace});
  }
  render() {
    return (
      <div>
        <PaceControls unit={this.state.unit} pace={this.state.pace} onUnitChange={this.onUnitChange} onPaceChange={this.onPaceChange}/>
        <Container text>
          <PaceTable unit={this.state.unit} pace={this.state.pace} onPaceChange={this.onPaceChange}/>
        </Container>
      </div>
    );
}
}

class App extends Component {
  render() {
    return (
      <div className="App">
        <h1>Running Pace Chart</h1>
        <p>5K, 10K, 1/2 Marathon, Marathon finish times given your expected pace.</p>
        <PaceChart />
      </div>
    );
  }
}

export default App;
