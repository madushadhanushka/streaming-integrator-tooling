/*
 *  Copyright (c) 2018, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 *  WSO2 Inc. licenses this file to you under the Apache License,
 *  Version 2.0 (the "License"); you may not use this file except
 *  in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing,
 *  software distributed under the License is distributed on an
 *  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 *  KIND, either express or implied.  See the License for the
 *  specific language governing permissions and limitations
 *  under the License.
 *
 */

import React from 'react';
import PropTypes from 'prop-types';
import Widget from '@wso2-dashboards/widget';
import {MuiThemeProvider, createMuiTheme} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import CancelIcon from '@material-ui/icons/Cancel';
import ArrowDropUpIcon from '@material-ui/icons/ArrowDropUp';
import ClearIcon from '@material-ui/icons/Clear';
import Chip from '@material-ui/core/Chip';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Select from 'react-select';
import dataProviderConf from './resources/dataProviderConf.json';

const customTheme = createMuiTheme({});
const customStyles = {};

const allOption = [{
    value: 'All',
    label: 'All',
    disabled: false
}];

/**
 * Options class passed to the react-select component
 */
class Option extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const {children, isFocused, onFocus, isDisabled} = this.props;
        return (
            <MenuItem
                onFocus={onFocus}
                selected={isFocused}
                disabled={isDisabled}
                onClick={() => this.props.onSelect(this.props.option, event)}
                component="div"
            >
                {children}
            </MenuItem>
        );
    }
}

/**
 * Function to wrap react-select component
 * @param props
 * @returns <Select> componet
 * @constructor
 */
function SelectWrapped(props) {
    const {classes, ...other} = props;
    return (
        <Select
            styles={customStyles}
            optionComponent={Option}
            noResultsText={<Typography>{'No results found'}</Typography>}
            arrowRenderer={arrowProps => {
                return arrowProps.isOpen ? <ArrowDropUpIcon/> : <ArrowDropDownIcon/>;
            }}
            isClearable
            clearRenderer={() => <ClearIcon/>}
            valueComponent={valueProps => {
                const {value, children, onRemove} = valueProps;
                const onDelete = event => {
                    event.preventDefault();
                    event.stopPropagation();
                    onRemove(value);
                };
                if (onRemove) {
                    return (
                        <Chip
                            tabIndex={-1}
                            label={children}
                            className={classes.chip}
                            deleteIcon={<CancelIcon onTouchEnd={onDelete}/>}
                            onDelete={onDelete}
                        />
                    );
                }
                return <div className="Select-value">{children}</div>;
            }}
            {...other}
        />
    );
}

/**
 * HTTPAnalyticsRequestCountFilter which renders the perspective and filter in home page
 */
class HTTPAnalyticsRequestCountFilter extends Widget {
    constructor(props) {
        super(props);
        this.state = {
            perspective: 0,
            servers: [],
            serverOptions: [],
            selectedServerValues: null,
            services: [],
            serviceOptions: [],
            selectedServiceValues: null,
            selectedSingleServiceValue: null
        };

        this.props.glContainer.on('resize', () =>
            this.setState({
                width: this.props.glContainer.width,
                height: this.props.glContainer.height
            })
        );
        this.handleChange = this.handleChange.bind(this);
        this.handleDataReceived = this.handleDataReceived.bind(this);
        this.publishUpdate = this.publishUpdate.bind(this);
    }

    /**
     * Publish user selection to other widgets
     */
    publishUpdate() {
        let filterOptions = {
            perspective: this.state.perspective,
            selectedServerValues: this.state.selectedServerValues,
            selectedServiceValues: this.state.selectedServiceValues,
            selectedSingleServiceValue: this.state.selectedSingleServiceValue
        };
        super.publish(filterOptions);
    }

    /**
     * Set the state of the widget after metadata and data is received from SiddhiAppProvider
     * @param data
     */
    handleDataReceived(data) {
        let servers = [], services = [], serverOptions, serviceOptions;
        data.data.map(dataUnit => {
            servers.push(dataUnit[0]);
            services.push(dataUnit[1]);
        });
        servers.push('All');
        services.push('All');

        servers = servers.filter((v, i, a) => a.indexOf(v) === i);
        services = services.filter((v, i, a) => a.indexOf(v) === i);

        serverOptions = servers.map(server => ({
            value: server,
            label: server,
            disabled: false
        }));

        serviceOptions = services.map(service => ({
            value: service,
            label: service,
            disabled: false
        }));

        this.setState({
            servers: servers,
            services: services,
            serviceOptions: serviceOptions,
            serverOptions: serverOptions,
            selectedServerValues: allOption,
            selectedServiceValues: allOption,
            selectedSingleServiceValue: allOption[0]
        }, this.publishUpdate);
    }

    /**
     * Publish user selection in filters
     * @param values
     */
    handleChange = name => values => {
        let options;
        let selectedOptionLabelName;
        let selectedOptionsName;
        let selectedValues;

        if (name === 0) {
            options = this.state.services;
            selectedOptionLabelName = "selectedServiceValues";
            selectedOptionsName = "serviceOptions";
            selectedValues = values;
        } else if (name === 1) {
            options = this.state.servers;
            selectedOptionLabelName = "selectedServerValues";
            selectedOptionsName = "serverOptions";
            selectedValues = values;
        } else {
            options = this.state.services;
            selectedOptionLabelName = "selectedSingleServiceValue";
            selectedOptionsName = "serviceOptions";
            selectedValues = new Array(1);
            selectedValues[0] = values;
        }

        let updatedOptions;
        if (selectedValues.some(value => value.value === 'All')) {
            updatedOptions = options.map(option => ({
                value: option,
                label: option,
                disabled: true
            }));
            this.setState({
                [selectedOptionLabelName]: [{
                    value: 'All',
                    label: 'All',
                    disabled: false
                }],
                [selectedOptionsName]: updatedOptions
            }, this.publishUpdate)
        } else {
            updatedOptions = options.map(option => ({
                value: option,
                label: option,
                disabled: false
            }));
            this.setState({
                [selectedOptionLabelName]: values,
                [selectedOptionsName]: updatedOptions
            }, this.publishUpdate);
        }
    };

    componentDidMount() {
        super.getWidgetChannelManager()
            .subscribeWidget(this.props.id, this.handleDataReceived, dataProviderConf);
    }

    componentWillUnmount() {
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
    }

    render() {
        const {classes} = this.props;
        return (
            <MuiThemeProvider theme={customTheme}>
                <div style={{margin: '2%', maxWidth: 840}}>
                    <Tabs
                        value={this.state.perspective}
                        onChange={(evt, value) => this.setState({perspective: value}, this.publishUpdate)}>
                        <Tab label="Server"/>
                        <Tab label="Service"/>
                        <Tab label="Method"/>
                    </Tabs>
                    <Typography component="div"
                                style={{'padding-top': 8, 'padding-left': 8 * 3, 'padding-right': 16}}>
                        {
                            this.state.perspective === 0 &&
                            <TextField
                                fullWidth={true}
                                value={this.state.selectedServiceValues}
                                onChange={this.handleChange(0)}
                                placeholder="Filter by Service"
                                label=""
                                InputLabelProps={{
                                    shrink: false,
                                }}
                                InputProps={{
                                    inputComponent: SelectWrapped,
                                    inputProps: {
                                        classes,
                                        isMulti: true,
                                        simpleValue: true,
                                        options: this.state.serviceOptions,
                                    }
                                }}
                            />
                        }
                        {
                            this.state.perspective === 1 &&
                            <TextField
                                fullWidth={true}
                                value={this.state.selectedServerValues}
                                onChange={this.handleChange(1)}
                                placeholder="Filter by Server"
                                label=""
                                InputLabelProps={{
                                    shrink: false,
                                }}
                                InputProps={{
                                    inputComponent: SelectWrapped,
                                    inputProps: {
                                        classes,
                                        isMulti: true,
                                        simpleValue: true,
                                        options: this.state.serverOptions,
                                    }
                                }}
                            />
                        }
                        {
                            this.state.perspective === 2 &&
                            <TextField
                                fullWidth={true}
                                value={this.state.selectedSingleServiceValue}
                                onChange={this.handleChange(2)}
                                placeholder="Choose a Service"
                                label=""
                                InputLabelProps={{
                                    shrink: false,
                                }}
                                InputProps={{
                                    inputComponent: SelectWrapped,
                                    inputProps: {
                                        classes,
                                        isMulti: false,
                                        simpleValue: true,
                                        options: this.state.serviceOptions,
                                    }
                                }}
                            />
                        }
                    </Typography>
                </div>
            </MuiThemeProvider>
        );
    }
}
HTTPAnalyticsRequestCountFilter.propTypes = {
    classes: PropTypes.object.isRequired,
};
global.dashboard.registerWidget("HTTPAnalyticsRequestCountFilter", HTTPAnalyticsRequestCountFilter);
