module.exports = async function () {
    // Give time for any remaining connections to close
    console.log('Global teardown: Waiting for connections to close...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Force exit the process if needed
    // This is a bit of a hack, but it helps with tests where connections might be hanging
    if (process.env.FORCE_EXIT === 'true') {
        console.log('Global teardown: Forcing process exit');
        process.exit(0);
    }

    console.log('Global teardown completed');
};
