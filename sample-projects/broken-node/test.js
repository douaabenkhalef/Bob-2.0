import { pad } from "./index.js";

if (pad("hi", 5) !== "   hi") {
  console.error("FAIL: expected '   hi'");
  process.exit(1);
}
console.log("PASS");
