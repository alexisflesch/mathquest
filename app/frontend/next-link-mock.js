const React = require('react');

module.exports = function NextLinkMock(props) {
    return React.createElement('a', { href: props.href || '#' }, props.children);
};
