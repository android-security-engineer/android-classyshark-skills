/*
 * Copyright 2026 Google, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 */

package com.google.classyshark.agent;

import java.io.IOException;
import java.io.InputStream;
import java.io.PrintStream;

/**
 * GUI-mode stdio entry point used by {@code -agent-gui-stdio}.
 *
 * <p>Routes to both the headless and the GUI command services so an Agent can
 * analyse archives and drive the live Swing window in one session.</p>
 */
public final class AgentStdioMain {
    private AgentStdioMain() {
    }

    public static void run(InputStream input, PrintStream output) throws IOException {
        ProtocolLoop.run(input, output, AgentCommandDispatcher.COMBINED);
    }

    public static void main(String[] args) throws IOException {
        run(System.in, System.out);
    }
}