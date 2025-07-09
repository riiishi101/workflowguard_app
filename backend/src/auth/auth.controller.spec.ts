import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: any;
  let userService: any;
  let jwtService: any;

  beforeEach(async () => {
    authService = { findOrCreateUser: jest.fn(), updateUserHubspotTokens: jest.fn(), updateUserLastActive: jest.fn(), updateUserHubspotPortalId: jest.fn(), validateUser: jest.fn(), login: jest.fn(), registerUser: jest.fn(), };
    userService = { getUserPlan: jest.fn() };
    jwtService = { sign: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: UserService, useValue: userService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
