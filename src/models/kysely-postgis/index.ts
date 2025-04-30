'use strict';

import type{ Options } from './functions.js';

export * from './functions.js';

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
