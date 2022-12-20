"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tigma = void 0;
require("reflect-metadata");
const container_types_1 = require("./container.types");
const container_bindings_1 = require("./container.bindings");
function Tigma(options) {
    const container = container_bindings_1.configureContainer({
        logger: options === null || options === void 0 ? void 0 : options.logger
    });
    const logger = container.get(container_types_1.DI.ILoggerService);
    const engine = container.get(container_types_1.DI.ITigmaEngine);
    logger.debug(`Tigma Engine successfully created`);
    return engine;
}
exports.Tigma = Tigma;
//# sourceMappingURL=tigma.js.map