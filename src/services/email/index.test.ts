import { EmailService } from "./EmailService.js"
import { Actions, IAccount, IEmail } from "./types.js"
import { RootService } from "../../core/RootService.js"



let root: RootService

beforeEach(async () => {
	root = await RootService.Start({
		class: "email",
		account: <IAccount>{
			// https://ethereal.email/login
			host: 'smtp.ethereal.email',
			port: 587,
			auth: {
				user: 'kailee.gottlieb@ethereal.email',
				pass: 'Pr8HdqqRUWUdUrxPVw'
			}
		},
	})
})

afterAll(async () => {
	await RootService.Stop(root)
})

test("invio email", async () => {
	const email = root.nodeByPath<EmailService>("/email")!
	expect(email).toBeInstanceOf(EmailService)

	let res = false


	// intanto intercetto l'EVENT
	// email.emitter.once(ServiceBaseEvents.DISPATCH, (action) => {
	// 	res = true
	// })
	// invio l'email
	await email.execute({
		type: Actions.SEND,
		payload: <IEmail>{
			from: "from@test.com",
			to: "to@test.com",
			subject: "this is a test!",
			text: "Congratz! test success",
		}
	})
	// per il momento tocca controllare all'indirizzo:
	// https://ethereal.email/messages
	expect(res).toBeTruthy()


	// controllo esista un email
	res = await email.execute({
		type: Actions.CHECK,
		payload: "iorioivano@gmail.com"
	})
	expect(res).toBeTruthy()


	// controllo esista un email
	res = await email.execute({
		type: Actions.CHECK,
		payload: "pippojksdfhlghsjkfsd@gmail.com"
	})
	expect(res).toBeFalsy()
})