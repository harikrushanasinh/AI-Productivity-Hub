import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FilesService } from '../services/files.service';
import { RequestUploadUrlDto } from '../dto/request-upload-url.dto';
import { ConfirmUploadDto } from '../dto/confirm-upload.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('files')
@ApiBearerAuth()
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get()
  @ApiOperation({ summary: 'List files, optionally filtered by folder path' })
  list(@CurrentUser('userId') userId: string, @Query('folderPath') folderPath?: string) {
    return this.filesService.list(userId, folderPath);
  }

  @Get('storage-stats')
  @ApiOperation({ summary: 'Storage quota usage for the current user' })
  storageStats(@CurrentUser('userId') userId: string) {
    return this.filesService.storageStats(userId);
  }

  @Post('upload-url')
  @ApiOperation({ summary: 'Request a presigned S3 upload URL (step 1 of 2)' })
  requestUploadUrl(@CurrentUser('userId') userId: string, @Body() dto: RequestUploadUrlDto) {
    return this.filesService.requestUploadUrl(userId, dto);
  }

  @Post('confirm')
  @ApiOperation({ summary: 'Confirm a completed upload and persist its metadata (step 2 of 2)' })
  confirmUpload(@CurrentUser('userId') userId: string, @Body() dto: ConfirmUploadDto) {
    return this.filesService.confirmUpload(userId, dto.storageKey, {
      fileName: dto.fileName,
      mimeType: dto.mimeType,
      sizeBytes: dto.sizeBytes,
      folderPath: dto.folderPath,
    });
  }

  @Get(':id/download-url')
  @ApiOperation({ summary: 'Get a presigned download URL for a file' })
  getDownloadUrl(@CurrentUser('userId') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.filesService.getDownloadUrl(id, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a file (removes the S3 object and soft-deletes metadata)' })
  remove(@CurrentUser('userId') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.filesService.remove(id, userId);
  }
}
