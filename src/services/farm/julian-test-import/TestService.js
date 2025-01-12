import { ServiceBase } from "typexpress";
import { Actions } from "./utils.js";
/**
 * E' solo un NODE di test per vedere se funziona l'import npm
 */
export class TestService extends ServiceBase {
    get stateDefault() {
        return {
            ...super.stateDefault,
            value1: "pippo",
            value2: 34,
        };
    }
    get executablesMap() {
        return {
            ...super.executablesMap,
            [Actions.TEST_SET]: async (value1) => this.setState({ value1 }),
            [Actions.TEST_INCREMENT]: (delta) => this.setState({ value2: this.state.value2 + delta }),
        };
    }
}
