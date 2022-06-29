import { createRange, Fixture } from '$/index';
import type { MockConnection, Post } from '../MockConnection';
import UserFixture from './UserFixture';

export default class PostFixture extends Fixture<Post> {
	override dependencies = [UserFixture];

	override async seed(prisma: MockConnection): Promise<Post[]> {
		const posts = await createRange(prisma.post.create, 5, () => ({
			message: 'test',
			userId: 0,
		}));

		return posts;
	}
}
