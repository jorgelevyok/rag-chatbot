import { Public } from '@guards/auth.guard';
import { Controller, Delete, Get, Param, ParseUUIDPipe, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import multer = require('multer');
import { DocumentsService } from './documents.service';
import { MAX_PDF_BYTES } from './pdf.text';

@ApiTags('documents')
@Public()
@Controller('documents')
export class DocumentsController {
    constructor(private readonly documentsService: DocumentsService) {}

    @Get()
    list() {
        return this.documentsService.list();
    }

    @Post()
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            required: ['file'],
            properties: {
                file: { type: 'string', format: 'binary' },
            },
        },
    })
    @UseInterceptors(
        FileInterceptor('file', {
            storage: multer.memoryStorage(),
            limits: { fileSize: MAX_PDF_BYTES },
        }),
    )
    upload(@UploadedFile() file: Express.Multer.File) {
        return this.documentsService.upload(file);
    }

    @Delete(':document_id_public')
    remove(@Param('document_id_public', new ParseUUIDPipe()) documentIdPublic: string) {
        return this.documentsService.remove(documentIdPublic);
    }
}
