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
 * Headless (no-GUI) stdio entry point used by {@code -agent-stdio}.
 *
 * <p>This class must stay free of any GUI/Swing dependency so headless mode can
 * run on a server without a display and be packaged without GUI classes.</p>
 */
public final class HeadlessStdioMain {
    private HeadlessStdioMain() {
    }

    public static void run(InputStream input, PrintStream output) throws IOException {
        ProtocolLoop.run(input, output, new HeadlessAgentService());
    }

    public static void main(String[] args) throws IOException {
        run(System.in, System.out);
    }
}
