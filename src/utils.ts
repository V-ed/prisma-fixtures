import type { PrismaCreator, PrismaModel, PrismaUpsertor } from './@types/prisma';
import type { Range } from './fixture';

type InferredGeneric<R> = R extends PromiseLike<infer T> ? T : never;

type DataCreatorSpecifier<F extends PrismaCreator> = Parameters<F>[0]['data'];
type DataCreatorSpecifierMapped<F extends PrismaCreator> = (current: number) => DataCreatorSpecifier<F>;

type DataUpsertorSpecifier<F extends PrismaUpsertor> = Parameters<F>[0];
type DataUpsertorSpecifierMapped<F extends PrismaUpsertor> = (current: number) => DataUpsertorSpecifier<F>;

type AutoRange<T extends PrismaModel = PrismaModel> = {
	fromArray: T[];
	count: number;
	includeArray?: boolean;
};

type PossibleRange<T extends PrismaModel = PrismaModel> = number | Range | AutoRange<T>;

function isVarRange(o: unknown): o is Range {
	if (!o || typeof o != 'object') {
		return false;
	}

	return 'from' in o && 'to' in o;
}

function getRangeData<T extends PrismaModel = PrismaModel>(range: PossibleRange<T>): { count: number; delta: number; models?: T[] } {
	if (typeof range == 'number') {
		return { count: range, delta: 1 };
	}

	if (isVarRange(range)) {
		if (range.from <= 0) {
			throw `The 'from' range option must be bigger than 0! Given : '${range.from}'`;
		}
		if (range.from > range.to) {
			throw `The 'from' range option must be less or equal to the 'to' range option! From : '${range.from}', To : '${range.to}'`;
		}

		return { count: range.to - range.from, delta: range.from };
	} else {
		return {
			count: range.count,
			delta: range.fromArray.length + 1,
			models: range.includeArray ? range.fromArray : undefined,
		};
	}
}

export async function serialPromises<T>(promises: (() => PromiseLike<T>)[]) {
	if (!promises.length) {
		return [];
	}

	const results = await promises.reduce(
		(p, task) => p.then(async (prevResults = []) => [...prevResults, await task()]),
		Promise.resolve() as unknown as Promise<T[]>,
	);

	return Promise.all(results);
}

export async function createMany<F extends PrismaCreator>(
	fn: F,
	...dataSpecifiers: (DataCreatorSpecifier<F> | DataCreatorSpecifierMapped<F>)[]
): Promise<InferredGeneric<ReturnType<F>>[]> {
	const models = dataSpecifiers.map((dataSpecifier, index) => {
		const data =
			typeof dataSpecifier == 'function' ? (dataSpecifier as (current: number) => Parameters<F>[0]['data'])(index) : dataSpecifier;

		return () => fn({ data });
	});

	return serialPromises(models);
}

export async function createRange<F extends PrismaCreator>(
	fn: F,
	range: PossibleRange,
	dataCreator: DataCreatorSpecifierMapped<F>,
): Promise<InferredGeneric<ReturnType<F>>[]> {
	const { count, delta, models: previousModels } = getRangeData(range);

	const models = Array.from(Array(count).keys())
		.map((index) => dataCreator(index + delta))
		.map((dataSpecifier) => () => fn({ data: dataSpecifier }));

	return [...(previousModels ?? []), ...(await serialPromises(models))];
}

export async function upsertMany<F extends PrismaUpsertor>(
	fn: F,
	...dataSpecifiers: (DataUpsertorSpecifier<F> | DataUpsertorSpecifierMapped<F>)[]
): Promise<InferredGeneric<ReturnType<F>>[]> {
	const models = dataSpecifiers.map((dataSpecifier, index) => {
		const upsertor = typeof dataSpecifier == 'function' ? (dataSpecifier as (current: number) => Parameters<F>[0])(index) : dataSpecifier;

		return () => fn({ ...upsertor });
	});

	return serialPromises(models);
}

export async function upsertRange<F extends PrismaUpsertor>(
	fn: F,
	range: PossibleRange,
	dataUpsertor: DataUpsertorSpecifierMapped<F>,
): Promise<InferredGeneric<ReturnType<F>>[]> {
	const { count, delta, models: previousModels } = getRangeData(range);

	const models = Array.from(Array(count).keys())
		.map((index) => dataUpsertor(index + delta))
		.map((dataSpecifier) => () => fn({ ...dataSpecifier }));

	return [...(previousModels ?? []), ...(await serialPromises(models))];
}
