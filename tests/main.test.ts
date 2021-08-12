import { importFixtures } from '$/fixture-importer';
import { MockConnection } from './data/good/MockConnection';

describe('Checking exported functions', () => {
	it('loads fixtures using class-importer', async () => {
		const mockedPrisma = new MockConnection();

		const fixtures = await importFixtures({ prisma: mockedPrisma, fixturesPath: `${__dirname}/data/good` });

		expect(Array.isArray(fixtures)).toBe(true);
		expect(fixtures.length).toBe(2);

		expect(fixtures[0].name).toBe('UserFixture');
		expect(fixtures[1].name).toBe('PostFixture');
	});
});
