import test from "node:test";
import { backgroundScenario } from "./helpers/background-scenario.js";
test("chrome API: save, pause, resume, conflict, API rejection, and rollback", () =>
  backgroundScenario("chrome"));
