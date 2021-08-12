import type { Config } from '@jest/types';
import fs from 'fs';
import JSON5 from 'json5';
import { pathsToModuleNameMapper } from 'ts-jest/utils';

const tsConfig = JSON5.parse(fs.readFileSync('./tsconfig.json', 'utf-8'));

const config: Config.InitialOptions = {
	rootDir: './',
	preset: 'ts-jest',
	roots: ['tests'],
	testEnvironment: 'jsdom',
	coverageReporters: ['json-summary', 'text', 'lcov'],
	moduleNameMapper: pathsToModuleNameMapper(tsConfig.compilerOptions.paths, { prefix: '<rootDir>/' }),
	// setupFilesAfterEnv: ['jest-extended'],
};

export default config;
