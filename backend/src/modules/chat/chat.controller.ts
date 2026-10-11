import { Public } from '@guards/auth.guard';
import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { AskQuestionBodyDTO } from './dto/chat.dto';

@ApiTags('chat')
@Public()
@Controller('chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) {}

    @Post()
    ask(@Body() body: AskQuestionBodyDTO) {
        return this.chatService.ask(body);
    }
}
