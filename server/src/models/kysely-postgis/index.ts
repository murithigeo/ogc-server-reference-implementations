'use strict';

import type{ Options } from './functions.ts';

export * from './functions.ts';

// Global options
export let defaultOptions: Options = {
  validate: true,
  additionalParameters: [],
};

export function setDefaultOptions(options: Partial<Options>) {
  defaultOptions = {
    ...defaultOptions,
    ...options,
  };
}
