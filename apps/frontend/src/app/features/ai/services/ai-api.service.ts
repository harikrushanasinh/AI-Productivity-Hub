import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AiResult, ChatMessage, Conversation } from '../models/ai.model';

@Injectable({ providedIn: 'root' })
export class AiApiService {
  private readonly baseUrl = `${environment.apiUrl}/ai`;

  constructor(private readonly http: HttpClient) {}

  // Chat
  listConversations(): Observable<Conversation[]> {
    return this.http
      .get<{ data: Conversation[] }>(`${this.baseUrl}/chat/conversations`)
      .pipe(map((res) => res.data));
  }

  getMessages(conversationId: string): Observable<ChatMessage[]> {
    return this.http
      .get<{ data: ChatMessage[] }>(`${this.baseUrl}/chat/conversations/${conversationId}/messages`)
      .pipe(map((res) => res.data));
  }

  sendChatMessage(message: string, conversationId?: string) {
    return this.http
      .post<{ data: { conversationId: string; reply: ChatMessage } }>(`${this.baseUrl}/chat`, {
        message,
        conversationId,
      })
      .pipe(map((res) => res.data));
  }

  // Feature tools — each returns a single { result: string }
  rewrite(text: string, tone: string): Observable<AiResult> {
    return this.http
      .post<{ data: AiResult }>(`${this.baseUrl}/rewrite`, { text, tone })
      .pipe(map((res) => res.data));
  }

  writeEmail(intent: string, tone?: string): Observable<AiResult> {
    return this.http
      .post<{ data: AiResult }>(`${this.baseUrl}/email-writer`, { intent, tone })
      .pipe(map((res) => res.data));
  }

  summarizeMeeting(transcript: string): Observable<AiResult> {
    return this.http
      .post<{ data: AiResult }>(`${this.baseUrl}/meeting-summary`, { transcript })
      .pipe(map((res) => res.data));
  }

  generateCode(prompt: string, language?: string): Observable<AiResult> {
    return this.http
      .post<{ data: AiResult }>(`${this.baseUrl}/code-generator`, { prompt, language })
      .pipe(map((res) => res.data));
  }

  planDay(notes?: string): Observable<AiResult> {
    return this.http
      .post<{ data: AiResult }>(`${this.baseUrl}/daily-planner`, { notes })
      .pipe(map((res) => res.data));
  }
}
