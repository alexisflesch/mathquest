module.exports = function NextLinkMock(props) {
    return <a href={props.href || '#'}>{props.children}</a>;
};
