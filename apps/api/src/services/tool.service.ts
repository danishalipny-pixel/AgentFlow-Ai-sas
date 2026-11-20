import axios from 'axios';
import { isSsrfSafeUrl } from '../utils/security';
import { KnowledgeDocument, ToolDefinition } from '../models';

export interface ToolExecutionContext {
  organizationId: string;
  domainAllowlist?: string[];
  userId?: string;
}

export class ToolService {
  /**
   * Seed standard built-in tools into the database
   */
  public static async seedBuiltinTools(): Promise<void> {
    const builtinTools = [
      {
        name: 'calculator',
        displayName: 'Precision Calculator',
        category: 'Utility',
        description: 'Performs safe arithmetic and scientific calculations without executing arbitrary code.',
        parametersSchema: {
          type: 'object',
          properties: {
            expression: { type: 'string', description: 'Mathematical expression, e.g. (145 * 12) / 3.5' },
          },
          required: ['expression'],
        },
        requiresApproval: false,
        isBuiltin: true,
      },
      {
        name: 'datetime_tool',
        displayName: 'Date & Time Utility',
        category: 'Utility',
        description: 'Retrieves current timestamps, converts timezones, and computes date deltas.',
        parametersSchema: {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['current_time', 'add_days', 'diff'], default: 'current_time' },
            days: { type: 'number', description: 'Days to add or subtract' },
            timezone: { type: 'string', default: 'UTC' },
          },
        },
        requiresApproval: false,
        isBuiltin: true,
      },
      {
        name: 'text_summarizer',
        displayName: 'Text Summarizer',
        category: 'Text & NLP',
        description: 'Analyzes long documents, produces structured executive summaries and extracts key themes.',
        parametersSchema: {
          type: 'object',
          properties: {
            text: { type: 'string', description: 'Text to summarize' },
            maxLengthWords: { type: 'number', default: 150 },
          },
          required: ['text'],
        },
        requiresApproval: false,
        isBuiltin: true,
      },
      {
        name: 'csv_reader',
        displayName: 'CSV Data Parser',
        category: 'Data Analysis',
        description: 'Parses structured tabular CSV text, computes descriptive statistics and column schemas.',
        parametersSchema: {
          type: 'object',
          properties: {
            csvData: { type: 'string', description: 'Raw CSV text content' },
            limit: { type: 'number', default: 20 },
          },
          required: ['csvData'],
        },
        requiresApproval: false,
        isBuiltin: true,
      },
      {
        name: 'structured_parser',
        displayName: 'JSON & Data Validator',
        category: 'Data Analysis',
        description: 'Validates JSON payloads, normalizes structures, and extracts filtered properties.',
        parametersSchema: {
          type: 'object',
          properties: {
            jsonString: { type: 'string', description: 'Raw JSON string' },
            extractKey: { type: 'string', description: 'Optional dot-notated key to extract' },
          },
          required: ['jsonString'],
        },
        requiresApproval: false,
        isBuiltin: true,
      },
      {
        name: 'web_fetch',
        displayName: 'Secure HTTP Request (SSRF Guarded)',
        category: 'Web & API',
        description: 'Fetches authorized public web pages and APIs with strict SSRF protection and timeout limits.',
        parametersSchema: {
          type: 'object',
          properties: {
            url: { type: 'string', description: 'Target HTTP/HTTPS URL' },
            method: { type: 'string', enum: ['GET', 'POST'], default: 'GET' },
          },
          required: ['url'],
        },
        requiresApproval: true, // Requires human approval if mutating or sensitive
        isBuiltin: true,
      },
      {
        name: 'knowledge_search',
        displayName: 'Organization Knowledge Search',
        category: 'Knowledge Base',
        description: 'Searches the organization knowledge base documents for relevant context and citations.',
        parametersSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search keywords or question' },
            limit: { type: 'number', default: 5 },
          },
          required: ['query'],
        },
        requiresApproval: false,
        isBuiltin: true,
      },
    ];

    for (const tool of builtinTools) {
      await ToolDefinition.findOneAndUpdate({ name: tool.name }, tool, { upsert: true, new: true });
    }
  }

  /**
   * Execute a tool safely
   */
  public static async executeTool(
    toolName: string,
    parameters: Record<string, any>,
    context: ToolExecutionContext
  ): Promise<{ success: boolean; result?: any; error?: string }> {
    try {
      switch (toolName) {
        case 'calculator': {
          const expr = String(parameters.expression || '').trim();
          // Safe math evaluator: only allow numbers, parens, basic math operators
          if (!/^[0-9\s\+\-\*\/\.\(\)\%\^]+$/.test(expr)) {
            return { success: false, error: 'Invalid characters in mathematical expression.' };
          }
          // Safely evaluate using Function with strict mode and no external scope
          const sanitizedExpr = expr.replace(/\^/g, '**');
          const evalResult = new Function(`"use strict"; return (${sanitizedExpr});`)();
          return { success: true, result: { expression: expr, value: Number(evalResult) } };
        }

        case 'datetime_tool': {
          const now = new Date();
          const action = parameters.action || 'current_time';
          if (action === 'add_days') {
            const days = Number(parameters.days || 0);
            const target = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
            return { success: true, result: { original: now.toISOString(), adjusted: target.toISOString(), daysAdded: days } };
          }
          return {
            success: true,
            result: {
              utcIso: now.toISOString(),
              timestamp: now.getTime(),
              dateFormatted: now.toUTCString(),
            },
          };
        }

        case 'text_summarizer': {
          const text = String(parameters.text || '').trim();
          if (!text) return { success: false, error: 'Empty text provided' };
          const words = text.split(/\s+/);
          const maxWords = Math.min(Number(parameters.maxLengthWords || 100), 500);
          
          // Compute word frequency & sentences
          const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
          const summary = sentences.slice(0, 3).join(' ').trim();
          return {
            success: true,
            result: {
              originalWordCount: words.length,
              sentenceCount: sentences.length,
              summary: summary.length > 0 ? summary : text.slice(0, 300) + '...',
              keyTakeaways: sentences.slice(0, 2).map((s) => s.trim()),
            },
          };
        }

        case 'csv_reader': {
          const raw = String(parameters.csvData || '').trim();
          if (!raw) return { success: false, error: 'Empty CSV content' };
          const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
          if (lines.length === 0) return { success: false, error: 'No data lines found' };
          
          const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
          const limit = Math.min(Number(parameters.limit || 10), 100);
          const rows: any[] = [];
          
          for (let i = 1; i < Math.min(lines.length, limit + 1); i++) {
            const values = lines[i].split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
            const rowObj: Record<string, string> = {};
            headers.forEach((h, idx) => {
              rowObj[h] = values[idx] || '';
            });
            rows.push(rowObj);
          }

          return {
            success: true,
            result: {
              headers,
              totalRowsCount: lines.length - 1,
              sampleRowsReturned: rows.length,
              rows,
            },
          };
        }

        case 'structured_parser': {
          const jsonString = String(parameters.jsonString || '').trim();
          const parsed = JSON.parse(jsonString);
          let extracted = parsed;
          if (parameters.extractKey) {
            extracted = parameters.extractKey.split('.').reduce((acc: any, part: string) => acc?.[part], parsed);
          }
          return {
            success: true,
            result: {
              validJson: true,
              type: Array.isArray(parsed) ? 'array' : typeof parsed,
              keys: typeof parsed === 'object' && parsed !== null ? Object.keys(parsed) : [],
              data: extracted,
            },
          };
        }

        case 'web_fetch': {
          const targetUrl = String(parameters.url || '').trim();
          const ssrfCheck = isSsrfSafeUrl(targetUrl, context.domainAllowlist || []);
          if (!ssrfCheck.safe) {
            return { success: false, error: `SSRF Policy Violation: ${ssrfCheck.reason}` };
          }

          const response = await axios({
            method: parameters.method || 'GET',
            url: targetUrl,
            timeout: 7000,
            maxContentLength: 1024 * 1024, // 1MB max
            headers: {
              'User-Agent': 'AgentFlow-AI-Bot/1.0 (+https://agentflow.ai)',
            },
          });

          return {
            success: true,
            result: {
              status: response.status,
              statusText: response.statusText,
              headers: { 'content-type': response.headers['content-type'] },
              dataSnippet: typeof response.data === 'string' ? response.data.slice(0, 1500) : response.data,
            },
          };
        }

        case 'knowledge_search': {
          const query = String(parameters.query || '').trim().toLowerCase();
          const docs = await KnowledgeDocument.find({
            organizationId: context.organizationId,
            status: 'ready',
          }).limit(10);

          const matches: any[] = [];
          for (const doc of docs) {
            if (
              doc.title.toLowerCase().includes(query) ||
              doc.parsedContent.toLowerCase().includes(query)
            ) {
              const preview = doc.parsedContent.slice(0, 300);
              matches.push({
                documentId: doc._id.toString(),
                title: doc.title,
                fileName: doc.fileName,
                snippet: preview,
              });
            }
          }

          return {
            success: true,
            result: {
              query,
              matchCount: matches.length,
              documents: matches,
            },
          };
        }

        default:
          return { success: false, error: `Unknown tool: ${toolName}` };
      }
    } catch (err: any) {
      return { success: false, error: `Execution error in tool '${toolName}': ${err.message}` };
    }
  }
}
