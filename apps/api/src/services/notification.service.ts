import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import { config } from '../config';
import { Notification } from '../models';

export interface CreateNotificationOptions {
  organizationId: string | mongoose.Types.ObjectId;
  userId: string | mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: string;
  link?: string;
  metadata?: Record<string, any>;
  sendEmail?: boolean;
  userEmail?: string;
}

export class NotificationService {
  private static mailer = config.smtp.isConfigured
    ? nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.port === 465,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass,
        },
      })
    : null;

  public static async notify(options: CreateNotificationOptions): Promise<void> {
    try {
      // 1. Create in-app notification
      await Notification.create({
        organizationId: new mongoose.Types.ObjectId(options.organizationId.toString()),
        userId: new mongoose.Types.ObjectId(options.userId.toString()),
        title: options.title,
        message: options.message,
        type: options.type,
        link: options.link,
        metadata: options.metadata || {},
      });

      // 2. Dispatch email if requested
      if (options.sendEmail && options.userEmail) {
        if (this.mailer) {
          await this.mailer.sendMail({
            from: config.smtp.from,
            to: options.userEmail,
            subject: `[AgentFlow AI] ${options.title}`,
            text: options.message,
            html: `
              <div style="font-family: Arial, sans-serif; background-color: #0b0f17; color: #f3f4f6; padding: 24px; border-radius: 8px;">
                <h2 style="color: #d4af37; margin-bottom: 12px;">AGENTFLOW AI</h2>
                <h3 style="color: #ffffff;">${options.title}</h3>
                <p style="color: #9ca3af; font-size: 15px; line-height: 1.5;">${options.message}</p>
                ${options.link ? `<a href="${config.appBaseUrl}${options.link}" style="display: inline-block; background-color: #d4af37; color: #000; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 16px;">View Details in AgentFlow</a>` : ''}
                <hr style="border: 0; border-top: 1px solid #1f2937; margin: 24px 0;" />
                <p style="font-size: 12px; color: #6b7280;">AgentFlow AI &mdash; Autonomous AI Workforce Platform</p>
              </div>
            `,
          });
        } else {
          console.warn(`[NotificationService] SMTP not configured. Skipped dispatching email to ${options.userEmail}: "${options.title}"`);
        }
      }
    } catch (error) {
      console.error('[NotificationService] Error delivering notification:', error);
    }
  }
}
