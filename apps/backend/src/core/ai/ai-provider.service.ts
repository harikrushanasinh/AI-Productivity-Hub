import { Injectable, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

const DEFAULT_MODEL = 'claude-sonnet-4-5';
const MAX_TOKENS = 2048;

/**
 * Thin, single-responsibility wrapper around the Anthropic SDK. Every AI
 * feature in this module (chat, rewrite, email writer, summarizer, code
 * generator, OCR, daily planner) goes through this one class — feature
 * services build a system prompt and message list, this class just calls
 * the API and extracts text. Keeping this the only place that touches the
 * SDK directly makes it trivial to swap models, add retries, or add
 * usage/cost logging in one spot later.
 */
@Injectable()
export class AiProviderService implements OnModuleInit {
  private client!: Anthropic;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      // Deliberately does NOT throw at startup (unlike VAULT_ENCRYPTION_KEY) —
      // the rest of the app should still boot and work without AI features
      // configured; only AI endpoints themselves fail, with a clear message.
      return;
    }
    this.client = new Anthropic({ apiKey });
  }

  async complete(systemPrompt: string, messages: ChatTurn[]): Promise<string> {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'AI features are not configured on this server (missing ANTHROPIC_API_KEY).',
      );
    }

    const response = await this.client.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    return textBlock && 'text' in textBlock ? textBlock.text : '';
  }

  /** Vision-capable completion for OCR — sends an image alongside a text instruction. */
  async completeWithImage(
    systemPrompt: string,
    instruction: string,
    base64Image: string,
    mediaType: string,
  ): Promise<string> {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'AI features are not configured on this server (missing ANTHROPIC_API_KEY).',
      );
    }

    const response = await this.client.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType as never, data: base64Image },
            },
            { type: 'text', text: instruction },
          ],
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    return textBlock && 'text' in textBlock ? textBlock.text : '';
  }
}
