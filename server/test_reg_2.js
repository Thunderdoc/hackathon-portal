const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testRegistration() {
    const form = new FormData();
    form.append('teamName', 'Test Team ' + Date.now());

    // Create dummy members
    const members = [
        { fullName: 'Alice', email: `alice${Date.now()}@test.com`, phone: '1234567890' },
        { fullName: 'Bob', email: `bob${Date.now()}@test.com`, phone: '0987654321' }
    ];
    form.append('members', JSON.stringify(members));

    // Append dummy file for Member 0 Resume
    // We'll use this script file itself as a dummy content
    form.append('member-0-resume', fs.createReadStream(__filename));

    try {
        const res = await axios.post('http://localhost:5001/api/register', form, {
            headers: form.getHeaders()
        });
        console.log('SUCCESS:', res.status, res.data);
    } catch (e) {
        console.error('ERROR:', e.response ? e.response.data : e.message);
    }
}

testRegistration();
