import { isAdult, canDrive } from "./calculator.js";

let failed = false;

if (isAdult(20) !== true)   { console.error("FAIL: isAdult(20) should be true"); failed = true; }
if (isAdult(15) !== false)  { console.error("FAIL: isAdult(15) should be false"); failed = true; }
if (canDrive(true, false) !== true) { console.error("FAIL: canDrive(true,false) should be true"); failed = true; }

if (failed) process.exit(1);
console.log("PASS");
