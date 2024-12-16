export class ToolManager {
    constructor() {
        this.availableTools = {
            mathSolver: {
                name: "math_solver",
                description: "Solve basic math operations",
                parameters: {
                    type: "object",
                    properties: {
                        expression: {
                            type: "string",
                            description: "The math expression to evaluate (supports +, -, *, /)"
                        }
                    },
                    required: ["expression"]
                },
                execute: async ({ expression }) => {
                    try {
                        // Sanitize input to only allow basic math operations
                        const sanitized = expression.replace(/[^0-9+\-*/\s.()]/g, '');
                        return String(eval(sanitized));
                    } catch (error) {
                        return `Error: ${error.message}`;
                    }
                }
            }
            // Add more tools here in the future
        };

        this.enabledTools = new Set();
    }

    getEnabledTools() {
        return Array.from(this.enabledTools).map(toolName => ({
            type: "function",
            function: {
                name: this.availableTools[toolName].name,
                description: this.availableTools[toolName].description,
                parameters: this.availableTools[toolName].parameters
            }
        }));
    }

    async executeTool(toolName, args) {
        const tool = this.availableTools[toolName];
        if (!tool) throw new Error(`Tool ${toolName} not found`);
        if (typeof args === 'string') {
            try {
                args = JSON.parse(args);
            } catch (error) {
                console.error('Failed to parse tool arguments:', error);
                throw new Error('Invalid tool arguments');
            }
        }
        return await tool.execute(args);
    }
}
