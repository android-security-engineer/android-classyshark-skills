/*
 * Copyright 2026 Google, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 */

package com.google.classyshark.agent;

/** JSON-to-response adapter for embedders that do not need a transport. */
public final class AgentCommandDispatcher {

    // Combined router used by GUI mode: gui.* commands need the live GUI bridge.
    private static final HeadlessAgentService HEADLESS = new HeadlessAgentService();
    private static final GuiAgentService GUI = new GuiAgentService();

    /**
     * Combined service for {@code -agent-gui-stdio}: routes {@code gui.*} to the
     * GUI bridge and everything else to the headless analyser.
     */
    public static final CommandService COMBINED =
            request -> {
                String cmd = request.getCommand();
                return cmd.startsWith("gui.") || AgentCapabilities.CAPABILITIES.equals(cmd)
                        ? GUI.invoke(request)
                        : HEADLESS.invoke(request);
            };

    private AgentCommandDispatcher() {
    }

    /**
     * Combined dispatch used by GUI mode and by embedders that want both headless
     * and GUI verbs.
     */
    public static AgentResponse dispatch(String json) {
        try {
            return COMBINED.invoke(AgentRequest.parse(json));
        } catch (IllegalArgumentException e) {
            return AgentResponse.error("", "invalid_request", e.getMessage());
        } catch (RuntimeException e) {
            return AgentResponse.error("", "invalid_request", e.getMessage());
        }
    }

    /**
     * Dispatch through an explicit service. Used by the protocol loop so the
     * headless entry point can stay GUI-free.
     */
    public static String dispatch(CommandService service, String json) {
        try {
            return service.invoke(AgentRequest.parse(json)).toJson();
        } catch (IllegalArgumentException e) {
            return AgentResponse.error("", "invalid_request", e.getMessage()).toJson();
        } catch (RuntimeException e) {
            return AgentResponse.error("", "invalid_request", e.getMessage()).toJson();
        }
    }
}