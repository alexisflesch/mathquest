const React = require('react');

module.exports = function NextImageMock(props) {
    // Just render an img with the given props
    // eslint-disable-next-line @next/next/no-img-element
    return React.createElement('img', props);
};
