import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { config } from '../config';

export class ModelsController {
  /**
   * Check Ollama connectivity and list local models
   */
  public static async getStatus(_req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const response = await axios.get(`${config.aiServiceUrl}/api/v1/models/status`, {
        timeout: 4000,
      });
      res.json({
        success: true,
        data: {
          ...response.data,
          default_model: config.defaultModel,
          coder_model: config.coderModel,
          is_local_only: true,
        },
      });
    } catch {
      // Graceful fallback if AI service or Ollama is starting up
      res.json({
        success: true,
        data: {
          connected: false,
          active_model: config.defaultModel,
          coder_model: config.coderModel,
          installed_models: [config.defaultModel, config.coderModel],
          instructions: 'Run `ollama serve` and `ollama pull qwen2.5:7b` to enable local inference.',
          is_local_only: true,
        },
      });
    }
  }

  /**
   * Switch the active default model
   */
  public static async switchModel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { model } = req.body;
      if (!model) {
        res.status(400).json({ success: false, message: 'Model identifier required' });
        return;
      }

      const response = await axios.post(
        `${config.aiServiceUrl}/api/v1/models/switch`,
        { model },
        { timeout: 4000 }
      );

      res.json({
        success: true,
        data: response.data,
      });
    } catch (err: any) {
      next(err);
    }
  }
}
