/*
 * Copyright 2026 Google, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 */

package com.google.classyshark.agent;

/** A service that turns an Agent request into a response. */
public interface CommandService {
    AgentResponse invoke(AgentRequest request);
}
