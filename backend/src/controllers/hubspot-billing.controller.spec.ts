// hubspot-billing.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { HubSpotBillingController } from './hubspot-billing.controller';
import { HubSpotBillingService } from '../services/hubspot-billing.service';
import { Request, Response } from 'express';
import * as crypto from 'crypto';

describe('HubSpotBillingController', () => {
  let controller: HubSpotBillingController;
  let service: { updateUserPlansForPortal: jest.Mock };
  let oldEnv: NodeJS.ProcessEnv;

  beforeEach(async () => {
    service = { updateUserPlansForPortal: jest.fn() };
    oldEnv = { ...process.env };
    process.env.HUBSPOT_CLIENT_SECRET = 'testsecret';
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HubSpotBillingController],
      providers: [
        { provide: HubSpotBillingService, useValue: service },
      ],
    }).compile();
    controller = module.get<HubSpotBillingController>(HubSpotBillingController);
  });

  afterEach(() => {
    process.env = oldEnv;
  });

  function makeSignature(body: any) {
    return crypto.createHmac('sha256', 'testsecret').update(JSON.stringify(body)).digest('hex');
  }

  it('should process webhook with valid signature', async () => {
    const body = { portalId: '123', newPlanId: 'pro' };
    const req = { headers: { 'x-hubspot-signature': makeSignature(body) } } as any as Request;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any as Response;
    await controller.handleHubSpotBillingWebhook(body, req, res);
    expect(service.updateUserPlansForPortal).toHaveBeenCalledWith('123', 'pro');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Plan updated successfully' });
  });

  it('should reject webhook with invalid signature', async () => {
    const body = { portalId: '123', newPlanId: 'pro' };
    const req = { headers: { 'x-hubspot-signature': 'invalid' } } as any as Request;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any as Response;
    await controller.handleHubSpotBillingWebhook(body, req, res);
    expect(service.updateUserPlansForPortal).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid HubSpot webhook signature' });
  });

  it('should reject webhook with missing portalId or newPlanId', async () => {
    const body = { portalId: '123' };
    const req = { headers: { 'x-hubspot-signature': makeSignature(body) } } as any as Request;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any as Response;
    await controller.handleHubSpotBillingWebhook(body, req, res);
    expect(service.updateUserPlansForPortal).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Missing portalId or newPlanId in webhook payload' });
  });

  it('should return 500 if HUBSPOT_CLIENT_SECRET is not set', async () => {
    delete process.env.HUBSPOT_CLIENT_SECRET;
    const body = { portalId: '123', newPlanId: 'pro' };
    const req = { headers: { 'x-hubspot-signature': 'anything' } } as any as Request;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any as Response;
    await controller.handleHubSpotBillingWebhook(body, req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'HUBSPOT_CLIENT_SECRET not set in environment' });
  });
}); 