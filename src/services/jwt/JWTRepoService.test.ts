import { RootService } from "../../core/RootService.js"
import { PathFinder } from "../../core/path/PathFinder.js";
import * as jwtNs from "./index.js"


test("su creazione", async () => {

	const root = await RootService.Start({
		class: "jwt",
		secret: "secret_word!!!"
	})

	const jwt = new PathFinder(root).getNode<jwtNs.Service>("/jwt")
	expect(jwt instanceof jwtNs.Service).toBeTruthy()

	const str = "test"

	// praticamente esegue questo:
	// https://github.com/auth0/node-jsonwebtoken#jwtsignpayload-secretorprivatekey-options-callback
	// notare che BISOGNA usare un oggetto: { payload: ..., options: ... }
	const token = await jwt.execute({
		type: jwtNs.Actions.ENCODE,
		// oggetto con "payload" e "options"
		payload: { 
			payload: str,
			//options: ...
		}
	})

	const str2 = await jwt.execute({
		type: jwtNs.Actions.DECODE,
		payload: token
	})

	expect(str).toBe(str2)

	await RootService.Stop(root)
})