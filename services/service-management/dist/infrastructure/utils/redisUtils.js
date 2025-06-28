"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearServiceCache = void 0;
const shared_1 = require("@fixserv-colauncha/shared");
function clearServiceCache() {
    return __awaiter(this, void 0, void 0, function* () {
        const keys = yield shared_1.redis.keys("services:*");
        if (keys.length > 0) {
            yield shared_1.redis.del(keys);
        }
    });
}
exports.clearServiceCache = clearServiceCache;
