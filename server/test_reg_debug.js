const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testRegistration() {
    const form = new FormData();
    const uniqueName = 'Team Debug ' + Date.now();
    form.append('teamName', uniqueName);

    // Create dummy members
    const members = [
        { fullName: 'Debug 1', email: `debug1_${Date.now()}@test.com`, phone: '1234567890' },
        { fullName: 'Debug 2', email: `debug2_${Date.now()}@test.com`, phone: '0987654321' }
    ];
    form.append('members', JSON.stringify(members));

    // Create a dummy file for testing upload if needed, or skip to test logic
    // Using current file as dummy
    form.append('member-0-resume', fs.createReadStream(__filename));

    try {
        console.log(`Sending registration request for: ${uniqueName}`);
        const res = await axios.post('http://localhost:5001/api/register', form, {
            headers: form.getHeaders()
        });
        console.log('SUCCESS:', res.status, res.data);
    } catch (e) {
        if (e.response) {
            console.error('SERVER ERROR:', e.response.status, e.response.data);
        } else {
            console.error('CONNECTION ERROR:', e.message);
        }
    }
}

testRegistration();
