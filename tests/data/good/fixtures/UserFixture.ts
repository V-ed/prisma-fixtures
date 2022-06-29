import { createRange, Fixture } from '$/index';
import type { MockConnection, User } from '../MockConnection';

export default class UserFixture extends Fixture<User> {
	override dependencies = [];

	override async seed(prisma: MockConnection): Promise<User[]> {
		const users = await createRange(prisma.user.create, 5, () => ({
			username: 'test',
		}));

		return users;
	}
}
