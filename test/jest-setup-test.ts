//
// Commands here are executed before running each test file
// See: https://jestjs.io/docs/en/configuration#setupfiles-array
//
// FIXES ISSUE:
// Class validator decorators are not validated with error:
// "TypeError: Reflect.getMetadata is not a function"
//
// See: https://github.com/nestjs/nest/issues/1305
//

import 'reflect-metadata';
import {configureContainer} from "../src/container.bindings"; // Should only be called once!!!

configureContainer();
