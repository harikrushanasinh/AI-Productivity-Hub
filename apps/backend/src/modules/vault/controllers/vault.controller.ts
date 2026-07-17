import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { VaultService } from '../services/vault.service';
import { CreateVaultItemDto } from '../dto/create-vault-item.dto';
import { UpdateVaultItemDto } from '../dto/update-vault-item.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('vault')
@ApiBearerAuth()
@Controller('vault/items')
export class VaultController {
  constructor(private readonly vaultService: VaultService) {}

  @Get()
  @ApiOperation({ summary: 'List vault items (metadata only — no secrets)' })
  list(@CurrentUser('userId') userId: string) {
    return this.vaultService.list(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single vault item (metadata only)' })
  findOne(@CurrentUser('userId') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.vaultService.findOneSummary(id, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a vault item (password encrypted server-side before storage)' })
  create(@CurrentUser('userId') userId: string, @Body() dto: CreateVaultItemDto) {
    return this.vaultService.create(userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a vault item' })
  update(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVaultItemDto,
  ) {
    return this.vaultService.update(id, userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a vault item' })
  remove(@CurrentUser('userId') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.vaultService.remove(id, userId);
  }

  // Extra-tight rate limit on the one endpoint that ever returns a decrypted
  // secret, independent of the app's default throttle — slows down brute-force
  // reveal attempts even from an authenticated-but-compromised session.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post(':id/reveal')
  @ApiOperation({ summary: 'Decrypt and return the password (and notes) for one item' })
  reveal(@CurrentUser('userId') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.vaultService.reveal(id, userId);
  }
}
