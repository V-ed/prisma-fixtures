import { createRange, Fixture } from '$/index';
import { PrismaClient } from '@prisma/client';
import UserFixture from './UserFixture';

class Post {
	id!: number;
	message!: string;
	userId!: number;
}

type PostCreator = (args: { data: Omit<Post, 'id'> }) => Promise<Post>;

export default class PostFixture extends Fixture<Post> {
	override dependencies = [UserFixture];

	override async seed(prisma: PrismaClient): Promise<Post[]> {
		const posts = await createRange(prisma.post.create as PostCreator, 5, () => ({
			message: 'test',
			userId: 0,
		}));

		return posts;
	}
}
