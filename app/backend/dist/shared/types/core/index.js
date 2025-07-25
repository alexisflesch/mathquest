"use strict";
/**
 * Core Types Index
 *
 * Exports all consolidated core type definitions to eliminate duplication
 * across the MathQuest codebase.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
// Core user types
__exportStar(require("./user"), exports);
// Core game types
__exportStar(require("./game"), exports);
// Core participant types
__exportStar(require("./participant"), exports);
// Core timer types  
__exportStar(require("./timer"), exports);
// Core answer types
__exportStar(require("./answer"), exports);
// Core question types
__exportStar(require("./question"), exports);
// Re-export dashboard payloads for convenience
__exportStar(require("../socket/dashboardPayloads"), exports);
