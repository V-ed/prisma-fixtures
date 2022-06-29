export class User {
	id!: number;
	username!: string;
}

export class Post {
	id!: number;
	message!: string;
	userId!: number;
}

export class MockConnection {
	async $connect() {
		return;
	}

	async $disconnect() {
		return;
	}

	user = {
		create: async (args: { data: Omit<User, 'id'> }): Promise<User> => ({ id: 1, ...args.data }),
	};

	post = {
		create: async (args: { data: Omit<Post, 'id'> }): Promise<Post> => ({ id: 1, ...args.data }),
	};
}
