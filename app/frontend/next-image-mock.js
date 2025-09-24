const React = require('react');

module.exports = function NextImageMock(props) {
    // Just render an img with the given props
    return React.createElement('img', props);
};
