/* eslint-disable @typescript-eslint/no-explicit-any */

export type PrismaClientLike = {
	$disconnect: () => Promise<unknown>;
};

export type PrismaCreateDataArgType = { data: any };
export type PrismaUpsertDataArgType = {
	create: any;
	update: any;
	where: any;
};

export type PrismaFnReturnType = PromiseLike<any>;

export type PrismaCreator = (args: PrismaCreateDataArgType) => PrismaFnReturnType;
export type PrismaUpsertor = (args: PrismaUpsertDataArgType) => PrismaFnReturnType;

export type PrismaModel = any;
