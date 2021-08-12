import { createRange, Fixture } from '$/index';
import { PrismaClient } from '@prisma/client';

class User {
	id!: number;
	username!: string;
}

type UserCreator = (args: { data: Omit<User, 'id'> }) => Promise<User>;

export default class UserFixture extends Fixture<User> {
	override dependencies = [];

	override async seed(prisma: PrismaClient): Promise<User[]> {
		const users = await createRange(prisma.user.create as UserCreator, 5, () => ({
			username: 'test',
		}));

		return users;
	}
}
