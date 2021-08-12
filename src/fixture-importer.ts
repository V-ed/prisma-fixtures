import { PrismaClient } from '@prisma/client';
import { importClasses } from 'class-importer';
import { DepGraph } from 'dependency-graph';
import { Fixture, IdentityModel, LinkMethod, LinkMode } from './fixture';

export type ImportFixtureOptions = {
	/** The prisma client on which to import the fixtures in. Uses the default prisma client if undefined. */
	prisma: PrismaClient;
	/**
	 * The path to the fixtures folder. Defaults to `./prisma/fixtures`. `.` refer to project's root.
	 *
	 * Example paths :
	 * - `${__dirname}/fixtures` - current directory's fixture folder
	 */
	fixturesPath: string;
	/** Close Prisma's database or not after importing all fixtures. Defaults to `true`. */
	doCloseDatabase: boolean;
};

function getSpecs(options?: Partial<ImportFixtureOptions>): ImportFixtureOptions {
	return {
		prisma: options?.prisma ?? new PrismaClient(),
		fixturesPath: options?.fixturesPath ?? './prisma/fixtures',
		doCloseDatabase: options?.doCloseDatabase ?? true,
	};
}

type DependenciesData = Record<string, IdentityModel[]>;

function createLinkFn(fixture: Fixture, depsData: DependenciesData): LinkMethod<Fixture> {
	return (dependency: typeof fixture['dependencies'][number], option) => {
		const data: IdentityModel[] | undefined = depsData[dependency.name];

		if (!data?.length) {
			throw 'Data missing!';
		}

		if (typeof option == 'number') {
			if (option < 0) {
				throw `The index must be bigger than 0! Given : '${option}'`;
			}
			if (data.length < option) {
				throw `Trying to link to a model that is out of the bounds of the given fixture! Max allowed : '${data.length}', given : '${option}'`;
			}

			return data[option];
		} else if (typeof option == 'string') {
			switch (option) {
				case LinkMode.RANDOM:
					return data[Math.floor(Math.random() * data.length)];
				default:
					throw 'Library error!';
			}
		} else {
			const { from, to } = option;

			if (from < 0) {
				throw `The 'from' option must be bigger than 0! Given : '${from}'`;
			}
			if (data.length < to) {
				throw `The 'to' option cannot be bigger than the selected fixture's size! Max allowed : '${data.length}', given : '${to}'`;
			}
			if (from > to) {
				throw `The 'from' option must be less or equal to the 'to' option! From : '${from}', To : '${to}'`;
			}

			return data[from + Math.floor(Math.random() * (to - from))];
		}
	};
}

/**
 *
 * @param options Options defining so behavior of the importation, such as the fixtures path and if the database should be closed.
 * @returns Promise containing the results of the seeds, tagged by their (class) name and their created models.
 * If an error occurred while seeding, the resulting promise will short-circuit to throw said error, respecting the given options.
 */
export async function importFixtures(options?: Partial<ImportFixtureOptions>) {
	const specs = getSpecs(options);

	const fixtureContainer = importClasses(Fixture, specs.fixturesPath);

	const fixtureInstances = await fixtureContainer.getDetailedInstances();

	const depGraph = new DepGraph<Fixture>();

	fixtureInstances.forEach(({ name, instance: fixture }) => {
		depGraph.addNode(name, fixture);
	});

	fixtureInstances.forEach(({ name, instance: fixture }) => {
		fixture.dependencies?.forEach((dep) => {
			depGraph.addDependency(name, dep.name);
		});
	});

	const order = depGraph.overallOrder();

	const dependenciesData: DependenciesData = {};

	try {
		const result = await order
			.map((fixtureName) => {
				return {
					name: fixtureName,
					fixture: depGraph.getNodeData(fixtureName),
				};
			})
			.map(({ name, fixture }) => {
				return async () => {
					const linkToThisFixtureFn = createLinkFn(fixture, dependenciesData);

					const models = await fixture.seed(specs.prisma, linkToThisFixtureFn);

					dependenciesData[name] = models;

					return {
						name,
						models,
					};
				};
			})
			.reduce(
				(p, task) => p.then(async (prevResults = []) => [...prevResults, await task()]),
				Promise.resolve() as unknown as Promise<
					{
						name: string;
						models: IdentityModel[];
					}[]
				>,
			);

		if (specs.doCloseDatabase) {
			await specs.prisma.$disconnect();
		}

		return result;
	} catch (error) {
		if (specs.doCloseDatabase) {
			await specs.prisma.$disconnect();
		}

		console.error(error);

		throw error;
	}
}
