/** @jsx React.DOM */
/* jshint newcap: false */
/* global React */

/**
 * @namespace My Namespace
 */
var NS = NS || {};

/**
 * @module Combobox
 */
NS.Combobox = (function(React) {

    var cx = React.addons.classSet;

    /**
     * Generate CSS class for Element
     * @param  {string} blockName
     * @param  {string} elemName  Element name
     * @return {string}           CSS class for Element
     */
    var clsElem = function(blockName, elemName) {
        var className = blockName + '__' + elemName;
        return className;
    };

    /**
     * Generate CSS class for Block or Element state (modificator)
     * @param  {string} blockName Block name or Element name generated by clsElem
     * @param  {string} stateName
     * @param  {string} [stateValue]
     * @return {string}             CSS class for Block or Element with state
     */
    var clsState = function(blockName, stateName, stateValue) {
        var className = blockName + '_' + stateName +
                        ((stateValue == null) ? '' : '-' +  stateValue);
        return className;
    };

    var BLOCK = 'Combobox';

    /**
     * Combo box option UI component
     * @class
     */
    var ComboboxOption = React.createClass({
        // Default component methods
        propTypes: {
            selected: React.PropTypes.bool,
            children: React.PropTypes.string.isRequired,
            value: React.PropTypes.object,
            onClick: React.PropTypes.func
        },

        getDefaultProps: function(argument) {
            return {
                selected: false,
                children: "",
                value: null
            };
        },

        render: function() {
            var cls = {};
            cls[clsElem(BLOCK, 'dropdownOption')] = true;
            cls[clsState(clsElem(BLOCK, 'dropdownOption'), 'selected')] = this.props.selected;

            return (
                <li className={cx(cls)} onClick={this.onClick}>
                    {this.props.children}
                </li>
            );
        },

        onClick: function(evt) {
            this.props.onClick(evt, this.props.label, this.props.value);
            return false;
        }
    });

    /**
     * Combo box UI component
     * @class
     */
    var Combobox = React.createClass({
        // Default component methods
        propTypes: {
            defaultValue: React.PropTypes.string,
            data: React.PropTypes.arrayOf(
                    React.PropTypes.shape({ label: React.PropTypes.string.isRequired })
                ).isRequired
        },

        getDefaultProps: function(argument) {
            return {
                defaultValue: "",
                data: []
            };
        },

        getInitialState: function() {
            return {
                isOpen: false,
                _filtratedData: this.props.data,
                _textValue: this.props.defaultValue,
                _selectedOptionData: null,
                _selectedIndex: -1
            };
        },

        render: function() {
            return (
                <div className={BLOCK + ' ' + ((this.state.isOpen) ? clsState(BLOCK, 'open') : '')}
                    onKeyDown={this._handleKeyDown}>
                    <input
                        ref="textField"
                        type="text"
                        className={clsElem(BLOCK, 'input')}
                        value={this.state._textValue}
                        onChange={this._handleTextChange}
                        onFocus={this._focus}
                        onBlur={this._blur}
                    />
                    <div className={clsElem(BLOCK, 'dropdown')}>
                        <div className={clsElem(BLOCK, 'dropdownWrapper')}>
                            <ul className={clsElem(BLOCK, 'dropdownList')}>
                                {this.state._filtratedData.map(this._dataToOption)}
                            </ul>
                        </div>
                    </div>
                    <span className={clsElem(BLOCK, 'buttonWrapper')}>
                        <button ref="button" type="button" onClick={this._handleButtonClick} className={clsElem(BLOCK, 'button')}>▼</button>
                    </span>
                </div>
            );
        },

        // Custom component methods
        // Private
        /**
         * Convert dataItem to <Option/>
         * @param  {object} dataItem
         * @param  {string} dataItem.label Label for option
         * @param  {number} idx index of element
         * @return {<Option/>}
         */
        _dataToOption: function(dataItem, idx) {
            var label = dataItem.label;
            var selected = (idx === this.state._selectedIndex);
            var item = (
                <ComboboxOption
                    selected={selected}
                    label={label}
                    value={dataItem}
                    key={'key-' + label.toLowerCase().replace(' ', '')}
                    onClick={this._handleOptionClick}>
                    {label}
                </ComboboxOption>
            );
            return item;
        },

        /**
         * Handle textField change
         * @param  {event} evt
         * @return false
         */
        _handleTextChange: function(evt) {
            var newValue = evt.target.value;
            this.setState({
                _selectedOptionData: null,
                _selectedIndex: -1
            });
            this.setTextValue(newValue);
            return false;
        },

        /**
         * Handle <Option> click
         * @param  {event} evt
         * @param  {string} label <Option/> label
         * @param  {object} dataItem <Option/> dataItem
         * @return false
         */
        _handleOptionClick: function(evt, label, dataItem) {
            this.setState({_selectedOptionData: dataItem});
            this.setTextValue(label);
            this.close();
            return false;
        },

        /**
         * Handle textField keyDown
         * @param  {event} evt
         * @return {bool} false if is ArrowDown/ArrowUp/Enter/Escape keys
         */
        _handleKeyDown: function(evt) {
            var result = true;
            if (evt.key === 'ArrowDown') {
                this._moveOptionSelection(1);
                result = false;
            } else if (evt.key === 'ArrowUp') {
                this._moveOptionSelection(-1);
                result = false;
            } else if (evt.key === 'Enter') {
                var dataItem = this.state._filtratedData[this.state._selectedIndex];
                if (dataItem) {
                    this._handleOptionClick(null, dataItem['label'], dataItem);
                }
                this.refs.textField.getDOMNode().blur();
                result = false;
            } else if (evt.key === 'Escape') {
                this.refs.textField.getDOMNode().blur();
                result = false;
            }
            return result;
        },

        /**
         * Handle button click
         * @param  {event} evt
         */
        _handleButtonClick: function(evt) {
            if (!this.state.isOpen) {
                this.refs.textField.getDOMNode().focus();
            }
            return false;
        },

        /**
         * Handle textField focus
         * @param  {event} evt
         */
        _focus: function(evt) {
            var len = this.state._textValue.length;
            this.refs.textField.getDOMNode().setSelectionRange(len, len);
            this.open();
            return false;
        },

        /**
         * Handle textField blur
         * @param  {event} evt
         */
        _blur: function(evt) {
            // HINT if this.close() fires before this._handleOptionClick() nothing happens :(
            setTimeout(this.close, 100);
            return false;
        },

        /**
         * move option selection
         * @param  {number} direction of selction move (positive - move down, negative - move up)
         */
        _moveOptionSelection: function(direction) {
            var _selectedIndex = this.state._selectedIndex + direction;
            if (_selectedIndex < 0) {
                _selectedIndex = this.state._filtratedData.length - 1;
            } else if (_selectedIndex >= this.state._filtratedData.length) {
                _selectedIndex = 0;
            }
            this.setState({_selectedIndex: _selectedIndex}, this._scrollToSelected);
        },

        /**
         * Scroll dropdown to selected element
         */
        _scrollToSelected: function() {
            var cls = clsState(clsElem(BLOCK, 'dropdownOption'), 'selected');
            this.getDOMNode().getElementsByClassName(cls)[0].scrollIntoView(false);
        },

        // Public
        /**
         * Open Combo box dropdown list is not empty
         */
        open: function() {
            var isOpen = this.state._filtratedData.length > 0;
            this.setState({
                isOpen: isOpen,
                _selectedIndex: -1
            });
        },

        /**
         * Close Combo box dropdown
         */
        close: function() {
            this.setState({
                isOpen: false
            });
        },

        /**
         * Toggle (Open or Close) Combo box dropdown
         */
        toggle: function() {
            if (this.state.isOpen) {
                this.open();
            } else {
                this.close();
            }
        },

        /**
         * Set Combobox text value
         * @param {string} newValue
         */
        setTextValue: function(newValue) {
            var val = newValue.toLowerCase().replace(' ', '');

            // TODO: filterFunc must be a component property
            var filterFunc = function(item){
                return item.label.toLowerCase().replace(' ', '').indexOf(val) >= 0;
            };
            var filtratedData = this.props.data.filter(filterFunc);

            this.setState({
                _textValue: newValue,
                _filtratedData: filtratedData,
                isOpen: filtratedData.length > 0
            });
        },

        /**
         * Get value
         * @return {string|object} value
         */
        value: function() {
            var result = this.state._selectedOptionData || this.state._textValue;
            return result;
        }
    });

    return Combobox;
})(React);
