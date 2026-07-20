import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiConversation } from '../entities/ai-conversation.entity';
import { AiMessage } from '../entities/ai-message.entity';

@Injectable()
export class AiRepository {
  constructor(
    @InjectRepository(AiConversation) private readonly conversationRepo: Repository<AiConversation>,
    @InjectRepository(AiMessage) private readonly messageRepo: Repository<AiMessage>,
  ) {}

  findConversationsByOwner(ownerId: string): Promise<AiConversation[]> {
    return this.conversationRepo.find({ where: { ownerId }, order: { updatedAt: 'DESC' } });
  }

  findConversationById(id: string, ownerId: string): Promise<AiConversation | null> {
    return this.conversationRepo.findOne({ where: { id, ownerId } });
  }

  createConversation(data: Partial<AiConversation>): AiConversation {
    return this.conversationRepo.create(data);
  }

  saveConversation(conversation: AiConversation): Promise<AiConversation> {
    return this.conversationRepo.save(conversation);
  }

  findMessages(conversationId: string): Promise<AiMessage[]> {
    return this.messageRepo.find({ where: { conversationId }, order: { createdAt: 'ASC' } });
  }

  createMessage(data: Partial<AiMessage>): AiMessage {
    return this.messageRepo.create(data);
  }

  saveMessage(message: AiMessage): Promise<AiMessage> {
    return this.messageRepo.save(message);
  }
}
