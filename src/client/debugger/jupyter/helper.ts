// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { DebugProtocol } from 'vscode-debugprotocol';
import { IKernelDebugAdapterConfig, KernelDebugMode } from '../types';

export function assertIsDebugConfig(thing: unknown): asserts thing is IKernelDebugAdapterConfig {
    const config = thing as IKernelDebugAdapterConfig;
    if (
        typeof config.__mode === 'undefined' ||
        ((config.__mode === KernelDebugMode.Cell || config.__mode === KernelDebugMode.RunByLine) &&
            typeof config.__cellIndex === 'undefined')
    ) {
        throw new Error('Invalid launch configuration');
    }
}

export function getMessageSourceAndHookIt(
    msg: DebugProtocol.ProtocolMessage,
    sourceHook: (source: DebugProtocol.Source | undefined) => void
): void {
    switch (msg.type) {
        case 'event':
            const event = msg as DebugProtocol.Event;
            switch (event.event) {
                case 'output':
                    sourceHook((event as DebugProtocol.OutputEvent).body.source);
                    break;
                case 'loadedSource':
                    sourceHook((event as DebugProtocol.LoadedSourceEvent).body.source);
                    break;
                case 'breakpoint':
                    sourceHook((event as DebugProtocol.BreakpointEvent).body.breakpoint.source);
                    break;
                default:
                    break;
            }
            break;
        case 'request':
            const request = msg as DebugProtocol.Request;
            switch (request.command) {
                case 'setBreakpoints':
                    sourceHook((request.arguments as DebugProtocol.SetBreakpointsArguments).source);
                    break;
                case 'breakpointLocations':
                    sourceHook((request.arguments as DebugProtocol.BreakpointLocationsArguments).source);
                    break;
                case 'source':
                    sourceHook((request.arguments as DebugProtocol.SourceArguments).source);
                    break;
                case 'gotoTargets':
                    sourceHook((request.arguments as DebugProtocol.GotoTargetsArguments).source);
                    break;
                default:
                    break;
            }
            break;
        case 'response':
            const response = msg as DebugProtocol.Response;
            if (response.success && response.body) {
                switch (response.command) {
                    case 'stackTrace':
                        (response as DebugProtocol.StackTraceResponse).body.stackFrames.forEach((frame) =>
                            sourceHook(frame.source)
                        );
                        break;
                    case 'loadedSources':
                        (response as DebugProtocol.LoadedSourcesResponse).body.sources.forEach((source) =>
                            sourceHook(source)
                        );
                        break;
                    case 'scopes':
                        (response as DebugProtocol.ScopesResponse).body.scopes.forEach((scope) =>
                            sourceHook(scope.source)
                        );
                        break;
                    case 'setFunctionBreakpoints':
                        (response as DebugProtocol.SetFunctionBreakpointsResponse).body.breakpoints.forEach((bp) =>
                            sourceHook(bp.source)
                        );
                        break;
                    case 'setBreakpoints':
                        (response as DebugProtocol.SetBreakpointsResponse).body.breakpoints.forEach((bp) =>
                            sourceHook(bp.source)
                        );
                        break;
                    default:
                        break;
                }
            }
            break;
    }
}
