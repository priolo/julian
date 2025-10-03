import nodemailer, { Transporter } from "nodemailer"
import { Actions, IAccount, IEmail } from "./types.js"
import { ServiceBase } from "../../core/ServiceBase.js"
import emailCheck from "email-check"



export type EmailServiceConf = Partial<EmailService['stateDefault']>

/**
 * Gestisce il traffico in uscita delle email tramite un account definito nel config
 */
export class EmailService extends ServiceBase {

	private transporter: Transporter = null

	get stateDefault() {
		return {
			...super.stateDefault,
			name: "email",
			account: null,
		}
	}

	declare state: typeof this.stateDefault

	get executablesMap() {
		return {
			...super.executablesMap,

			[Actions.CREATE_TEST_ACCOUNT]: async () => {
				const account = await nodemailer.createTestAccount()
				this.setState({ account })
			},

			[Actions.CREATE_ACCOUNT]: (account: IAccount) => {
				this.setState({ account })
			},
			[Actions.SEND]: async (email: IEmail) => {
				await this.transporter.sendMail(email)
			},
			[Actions.CHECK]: async (address: string) => {
				let res = false
				try {
					res = await emailCheck(address)
				} catch (err: any) {
					if (err.message === 'refuse') {
						// The MX server is refusing requests from your IP address.
					} else {
						// Decide what to do with other errors.
					}
				}
				return res
			},
		}
	}

	protected onStateChanged(oldState: EmailServiceConf, newState: EmailServiceConf, partialState: Partial<EmailServiceConf>): void {
		super.onStateChanged(oldState, newState, partialState)

		const { account } = this.state
		if (oldState.account == account) return
		if (!account) {
			this.transporter?.close()
			this.transporter = null
			return
		}
		this.transporter = nodemailer.createTransport(account)
	}

}
