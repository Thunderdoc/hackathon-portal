console.log("Step 1: Starting debug script");
try {
    console.log("Step 2: Requiring fs");
    const fs = require('fs');
    console.log("Step 3: Requiring path");
    const path = require('path');
    console.log("Step 4: Requiring express");
    const express = require('express');
    console.log("Step 5: Requiring cors");
    const cors = require('cors');
    console.log("Step 6: Requiring body-parser");
    const bodyParser = require('body-parser');
    console.log("Step 7: Requiring multer");
    const multer = require('multer');
    console.log("Step 8: Requiring csv-writer");
    const { createObjectCsvStringifier } = require('csv-writer');
    console.log("Step 9: Requiring sqlite3");
    const sqlite3 = require('sqlite3').verbose();

    console.log("Step 10: All modules loaded. Initializing app...");
    const app = express();
    console.log("Step 11: App initialized.");

    console.log("Step 12: Requiring local db module");
    const db = require('./db');
    console.log("Step 13: Local db module loaded.");

} catch (e) {
    console.error("CRITICAL ERROR:", e);
}
