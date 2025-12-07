async function testSystem() {
    const baseURL = 'http://localhost:5001/api';

    console.log("1. Simulating Team Message...");
    try {
        const res = await fetch(`${baseURL}/team/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teamId: 1, message: "Test Message for Admin Logic Verification" })
        });
        if (res.ok) console.log("   -> Message Sent");
        else console.log("   -> Failed: " + res.status);
    } catch (e) { console.error("   -> Failed:", e.message); }

    console.log("2. Simulating Distress Signal...");
    try {
        const res = await fetch(`${baseURL}/mentorship/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teamId: 1, category: "URGENT", description: "Logic Verification Distress Signal" })
        });
        if (res.ok) console.log("   -> Distress Signal Sent");
        else console.log("   -> Failed: " + res.status);
    } catch (e) { console.error("   -> Failed:", e.message); }

    console.log("3. Verifying Logs...");
    try {
        const res = await fetch(`${baseURL}/admin/logs`);
        const logs = await res.json();
        const msgLog = logs.find(l => l.includes("Test Message for Admin Logic Verification"));
        const distressLog = logs.find(l => l.includes("Logic Verification Distress Signal"));

        if (msgLog) console.log("   -> SUCCESS: Message found in System Logs");
        else console.error(`   -> FAILURE: Message NOT found in System Logs.`);

        if (distressLog) console.log("   -> SUCCESS: Distress Signal found in System Logs");
        else console.error(`   -> FAILURE: Distress Signal NOT found in System Logs.`);
    } catch (e) { console.error("   -> Failed to fetch logs:", e.message); }

    console.log("4. Verifying Inbox...");
    try {
        const res = await fetch(`${baseURL}/admin/messages`);
        const messages = await res.json();
        const msg = messages.find(m => m.message === "Test Message for Admin Logic Verification");
        if (msg) console.log("   -> SUCCESS: Message found in Admin Inbox");
        else console.error("   -> FAILURE: Message NOT found in Admin Inbox");
    } catch (e) { console.error("   -> Failed to fetch messages:", e.message); }
}

testSystem();
