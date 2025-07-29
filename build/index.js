const { exec } = require('child_process');

console.log('Building Server Files...');

// Run npm install to ensure default dependencies are installed
exec('npm install', (error, stdout, stderr) => {
    if (error) {
        console.error(`❌ Error: ${error.message}`);
        return;
    }

    if (stderr) {
        console.error(`⚠️ Stderr: ${stderr}`);
        return;
    }

    console.log(`${stdout}`);

    console.log('Server Files Built Successfully!');
});


console.log(process.env.IN_CLOUD_BUILD === 'true' ? 'Production Build' : 'Development Build');