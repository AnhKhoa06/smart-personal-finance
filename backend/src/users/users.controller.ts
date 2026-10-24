import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser, type AuthUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SetupDto } from './dto/setup.dto';
import { toProfile, UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  async me(@CurrentUser() auth: AuthUser) {
    const user = await this.users.findById(auth.id);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    return toProfile(user);
  }

  @Post('me/onboarding')
  async onboarding(@CurrentUser() auth: AuthUser, @Body() dto: SetupDto) {
    const { user, wallet } = await this.users.completeOnboarding(auth.id, dto);
    return { user: toProfile(user), wallet };
  }
}
