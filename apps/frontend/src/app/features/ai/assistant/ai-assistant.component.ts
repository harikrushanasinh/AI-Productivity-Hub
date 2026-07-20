import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiApiService } from '../services/ai-api.service';
import { ChatMessage } from '../models/ai.model';

type Tool = 'chat' | 'rewrite' | 'email' | 'summary' | 'code' | 'planner';

@Component({
  selector: 'aph-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-assistant.component.html',
  styleUrl: './ai-assistant.component.scss',
})
export class AiAssistantComponent implements OnInit {
  readonly activeTool = signal<Tool>('chat');
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // Chat
  readonly chatMessages = signal<ChatMessage[]>([]);
  readonly chatInput = signal('');
  readonly conversationId = signal<string | undefined>(undefined);

  // Rewrite
  readonly rewriteInput = signal('');
  readonly rewriteTone = signal('professional');
  readonly rewriteResult = signal('');

  // Email writer
  readonly emailIntent = signal('');
  readonly emailResult = signal('');

  // Meeting summary
  readonly transcriptInput = signal('');
  readonly summaryResult = signal('');

  // Code generator
  readonly codePrompt = signal('');
  readonly codeLanguage = signal('typescript');
  readonly codeResult = signal('');

  // Daily planner
  readonly plannerNotes = signal('');
  readonly plannerResult = signal('');

  constructor(private readonly aiApi: AiApiService) {}

  ngOnInit(): void {}

  selectTool(tool: Tool): void {
    this.activeTool.set(tool);
    this.errorMessage.set(null);
  }

  private handleError(): void {
    this.loading.set(false);
    this.errorMessage.set(
      'AI features need an ANTHROPIC_API_KEY configured on the server. Ask your admin to set one.',
    );
  }

  sendChatMessage(): void {
    const message = this.chatInput().trim();
    if (!message) return;

    this.chatMessages.update((msgs) => [...msgs, { id: 'temp', role: 'user', content: message }]);
    this.chatInput.set('');
    this.loading.set(true);

    this.aiApi.sendChatMessage(message, this.conversationId()).subscribe({
      next: (res) => {
        this.conversationId.set(res.conversationId);
        this.chatMessages.update((msgs) => [...msgs, res.reply]);
        this.loading.set(false);
      },
      error: () => this.handleError(),
    });
  }

  runRewrite(): void {
    if (!this.rewriteInput().trim()) return;
    this.loading.set(true);
    this.aiApi.rewrite(this.rewriteInput(), this.rewriteTone()).subscribe({
      next: (res) => {
        this.rewriteResult.set(res.result);
        this.loading.set(false);
      },
      error: () => this.handleError(),
    });
  }

  runEmailWriter(): void {
    if (!this.emailIntent().trim()) return;
    this.loading.set(true);
    this.aiApi.writeEmail(this.emailIntent()).subscribe({
      next: (res) => {
        this.emailResult.set(res.result);
        this.loading.set(false);
      },
      error: () => this.handleError(),
    });
  }

  runMeetingSummary(): void {
    if (!this.transcriptInput().trim()) return;
    this.loading.set(true);
    this.aiApi.summarizeMeeting(this.transcriptInput()).subscribe({
      next: (res) => {
        this.summaryResult.set(res.result);
        this.loading.set(false);
      },
      error: () => this.handleError(),
    });
  }

  runCodeGenerator(): void {
    if (!this.codePrompt().trim()) return;
    this.loading.set(true);
    this.aiApi.generateCode(this.codePrompt(), this.codeLanguage()).subscribe({
      next: (res) => {
        this.codeResult.set(res.result);
        this.loading.set(false);
      },
      error: () => this.handleError(),
    });
  }

  runDailyPlanner(): void {
    this.loading.set(true);
    this.aiApi.planDay(this.plannerNotes() || undefined).subscribe({
      next: (res) => {
        this.plannerResult.set(res.result);
        this.loading.set(false);
      },
      error: () => this.handleError(),
    });
  }

  trackByMessageId(index: number, message: ChatMessage): string {
    return message.id + index;
  }
}
