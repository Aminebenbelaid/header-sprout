import test from "node:test";
import { backgroundScenario } from "./helpers/background-scenario.js";
test("browser API: save, pause, resume, conflict, API rejection, and rollback", () =>
  backgroundScenario("browser"));
