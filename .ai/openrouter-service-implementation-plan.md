# OpenRouter Service Implementation Plan

This implementation plan defines the architecture and integration steps for the `OpenRouterService`. This service provides a unified interface for LLM completions via OpenRouter, with a focus on structured data extraction and robust error handling.

## 1. Service Description

The `OpenRouterService` is a centralized server-side utility for interacting with the OpenRouter API. It encapsulates the complexities of multi-model routing and response normalization.

### Key Components and Functionality

1. **`chatCompletion` Engine**: The core logic for sending messages to OpenRouter. It handles model selection, message sequencing, and parameter injection.
2. **Structured Output Handler**: A specialized component that manages `json_schema` enforcement to ensure the LLM returns data in a predictable format.
3. **Resilience Layer**: Manages the lifecycle of a request, including timeouts and retries for transient failures.

## 2. Constructor Description

The constructor initializes the service with credentials and base configuration. It follows the pattern of environment-first configuration with optional overrides.

- **Parameters**:
  - `config` (Optional): An object containing `apiKey`, `baseUrl`, and metadata like `siteUrl` and `siteName`.
- **Functionality**:
  - Sets the private `#apiKey` from `import.meta.env.OPENROUTER_API_KEY` if not provided.
  - Configures the base URL for API calls.
  - Initializes default headers required by OpenRouter (`HTTP-Referer`, `X-Title`).

## 3. Public Methods and Fields

### Methods

#### 1. `completeChat(params: ChatParams): Promise<ChatResponse>`

- **Description**: Sends a list of messages to a specific model.
- **Challenges**:
  1. **Provider Inconsistency**: Different models handle parameters like `temperature` slightly differently.
  2. **Streaming vs. Non-Streaming**: Managing state during long completions.
- **Solutions**:
  1. Use OpenRouter's parameter normalization to ensure consistent behavior.
  2. Focus on non-streaming responses for the MVP to simplify the service interface.

#### 2. `extractData<T>(params: ExtractionParams): Promise<T>`

- **Description**: Uses `response_format` to extract structured data into a TypeScript-typed object.
- **Challenges**:
  1. **Schema Non-Compliance**: The model might fail to follow the `strict: true` schema if the prompt is ambiguous.
  2. **Token Limits**: Large schemas consume significant input tokens.
- **Solutions**:
  1. Pair the schema with a strong system prompt that reiterates the required structure.
  2. Optimize schemas to use only necessary fields and primitive types where possible.

### Configuration Elements

The service implements OpenRouter API expectations as follows:

1. **System Message**: Configured via the `messages` array as the initial context.
   - _Example_: `{ role: 'system', content: 'You are a culinary expert.' }`
2. **User Message**: Added to the `messages` array representing user input or task instructions.
   - _Example_: `{ role: 'user', content: 'Format this ingredient list: [LIST]' }`
3. **Structured Responses (`response_format`)**: Enforced using the `json_schema` type.
   - _Example_:
     ```javascript
     response_format: {
       type: 'json_schema',
       json_schema: {
         name: 'recipe_detail',
         strict: true,
         schema: {
           type: 'object',
           properties: {
             name: { type: 'string' },
             calories: { type: 'number' }
           },
           required: ['name', 'calories'],
           additionalProperties: false
         }
       }
     }
     ```
4. **Model Name**: Specified in the request body to route to the desired LLM.
   - _Example_: `"google/gemini-2.0-flash-001"`
5. **Model Parameters**: Controls the behavior of the LLM generation.
   - _Example_: `{ "temperature": 0.1, "max_tokens": 1000 }`

## 4. Private Methods and Fields

1. **`#execute(endpoint: string, body: any)`**: The underlying `fetch` implementation that handles header injection and raw response processing.
2. **`#backoff(retryCount: number)`**: Logic for calculating delays between retries using exponential backoff.
3. **`#apiKey`**: Private field to store the API key securely within the class instance.

## 5. Error Handling

The service addresses the following error scenarios:

1. **Authentication Error (401)**: Triggered when the API key is missing or invalid.
2. **Rate Limit Error (429)**: Triggered when the provider or OpenRouter limit is reached; handled by the resilience layer.
3. **Invalid Schema Error (400)**: Triggered if the `json_schema` provided does not meet the provider's requirements.
4. **Model Overloaded (503)**: Triggered when the specific LLM provider is down; can be mitigated by choosing fallback models in OpenRouter.
5. **Parsing Error**: Triggered when the response body is not valid JSON or fails schema validation.

## 6. Security Considerations

- **Secrets Management**: The `OPENROUTER_API_KEY` must never be logged or exposed to the client-side. The service is strictly for server-side environments (Astro API routes).
- **Referer Validation**: OpenRouter uses the `HTTP-Referer` header for rankings; ensure this matches the verified production domain to protect the site's reputation.
- **Payload Limits**: Implement checks on input message size to prevent large payloads from incurring unexpected costs or hitting API limits.

## 7. Step-by-Step Implementation Plan

1. **Type Definitions**: Define `OpenRouterMessage`, `OpenRouterResponse`, and `ResponseFormat` interfaces in `src/types.ts` to match the OpenRouter API schema.
2. **Base Service**: Create `src/lib/services/ai/OpenRouterService.ts` and implement the constructor and private `#execute` method.
3. **Message Handling**: Implement the `completeChat` method, ensuring it correctly assembles the `messages` array with system and user roles.
4. **Structured Output Support**: Implement the `extractData` method using the `response_format` pattern with `strict: true`.
5. **Error & Retry Logic**: Add a wrapper around `#execute` that catches 429 errors and retries with exponential backoff.
6. **Integration**: Connect the service to the recipe import logic in `src/lib/services/recipes/createRecipeImport.ts` to replace manual parsing with LLM-driven extraction.
7. **Environment Configuration**: Add the required keys to `.env` and verify the service with a dedicated test script or API endpoint.
   Your task is to implement a service based on the provided implementation plan and implementation rules. Your goal is to create a detailed and accurate implementation that conforms to the provided plan, properly communicates with the API, and handles all specified functionalities and error cases.

First, review the implementation plan:
<implementation_plan>
{{implementation-plan}} <- replace with reference to service implementation plan

Create the service in {{path}}
</implementation_plan>

Now review the implementation rules:
<implementation_rules>
{{backend-rules}} <- replace with reference to rules useful for the service (e.g., shared.mdc)
</implementation_rules>

Implement the plan according to the following approach:
<implementation_approach>
Implement a maximum of 3 steps from the implementation plan, briefly summarize what you've done, and describe the plan for the next 3 actions - stop work at this point and wait for my feedback.
</implementation_approach>

Carefully analyze the implementation plan and rules. Pay special attention to service structure, API integration, error handling, and security concerns described in the plan.

Follow these steps to implement the service:

Service Structure:

- Define the service class according to the implementation plan
- Create a constructor initializing required fields
- Apply appropriate access modifiers for fields and methods (public, private)

Public Methods Implementation:

- Implement public methods listed in the plan
- Ensure each method is properly typed for both parameters and return values
- Provide complete implementation of business logic described in the plan

Private Methods Implementation:

- Develop helper methods listed in the plan
- Ensure proper encapsulation and separation of concerns
- Implement logic for data formatting, sending requests, and processing responses

API Integration:

- Implement logic for communicating with external API
- Handle all necessary request parameters and headers
- Ensure proper processing of API responses

Error Handling:

- Implement comprehensive error handling for all scenarios
- Apply appropriate retry mechanisms for transient errors
- Provide clear error messages for different scenarios

Security:

- Implement recommended security practices mentioned in the plan
- Ensure secure management of API keys and credentials
- Apply input validation to prevent attacks

Documentation and Typing:

- Define and apply appropriate interfaces for parameters and return values
- Ensure full type coverage for the entire service

Testing:

- Prepare service structure in a way that enables easy unit testing
- Include the ability to mock external dependencies

Throughout the implementation process, strictly adhere to the provided implementation rules. These rules take precedence over any general best practices that may conflict with them.

Ensure your implementation accurately reflects the provided implementation plan and adheres to all specified rules. Pay special attention to service structure, API integration, error handling, and security.
